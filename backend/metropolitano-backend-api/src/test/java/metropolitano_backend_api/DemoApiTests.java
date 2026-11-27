package metropolitano_backend_api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import java.util.UUID;
import java.util.concurrent.Executors;
import metropolitano_backend_api.demo.DemoService;
import metropolitano_backend_api.demo.DemoSessions;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:api-test;DB_CLOSE_DELAY=-1","metrolima.guest-access=true"})
@AutoConfigureMockMvc
class DemoApiTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired DemoService service;
    @Autowired DemoSessions sessions;
    @Autowired org.springframework.jdbc.core.JdbcTemplate db;

    @Test void otherInstanceCanReadAndRevokeSession() throws Exception {
        String auth = createAccount(phone());
        var other = new DemoSessions(db);
        assertEquals(sessions.accountId(auth), other.accountId(auth));
        assertEquals(0, db.queryForObject(
            "SELECT COUNT(*) FROM demo_session WHERE token_hash=?", Integer.class, auth.substring(7)));
        other.revoke(auth);
        mvc.perform(get("/api/v1/demo/state").header("Authorization", auth))
            .andExpect(status().isUnauthorized());
    }

    private String phone() { return "9" + String.format("%08d", Math.abs(UUID.randomUUID().hashCode() % 100000000)); }
    private String createAccount(String phone) throws Exception {
        var response=mvc.perform(post("/api/v1/demo/register").contentType("application/json")
            .content(mapper.writeValueAsString(java.util.Map.of(
                "fullName", "Usuario de prueba",
                "phone", phone,
                "dni", "76543210",
                "email", phone + "@gmail.com",
                "password", "ClaveSegura#123"))))
            .andExpect(status().isOk()).andReturn();
        return "Bearer " + mapper.readTree(response.getResponse().getContentAsString()).get("token").asText();
    }
    private String login(String phone) throws Exception {
        var response=mvc.perform(post("/api/v1/demo/sessions").contentType("application/json")
            .content(mapper.writeValueAsString(java.util.Map.of(
                "phone", phone, "password", "ClaveSegura#123"))))
            .andExpect(status().isOk()).andReturn();
        return "Bearer " + mapper.readTree(response.getResponse().getContentAsString()).get("token").asText();
    }
    private JsonNode state(String auth) throws Exception {
        return mapper.readTree(mvc.perform(get("/api/v1/demo/state").header("Authorization",auth)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
    @Test void sessionIsRequiredAndLogoutRevokesIt() throws Exception {
        mvc.perform(get("/api/v1/demo/state")).andExpect(status().isUnauthorized());
        var auth=createAccount(phone());
        mvc.perform(delete("/api/v1/demo/sessions/current").header("Authorization",auth)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/demo/state").header("Authorization",auth)).andExpect(status().isUnauthorized());
    }
    @Test void profilePersistsAndDoesNotLeakBetweenAccounts() throws Exception {
        var phone=phone(); var auth=createAccount(phone); var version=state(auth).get("profile").get("version").asLong();
        var body="{\"fullName\":\"Ana Torres\",\"phone\":\"987654321\",\"dni\":\"12345678\",\"email\":\"ana@example.com\",\"version\":"+version+"}";
        mvc.perform(patch("/api/v1/demo/me").header("Authorization",auth).contentType("application/json").content(body)).andExpect(status().isOk());
        assertEquals("Ana Torres",state(login(phone)).get("profile").get("fullName").asText());
        assertEquals("Usuario de prueba",state(createAccount(phone())).get("profile").get("fullName").asText());
        mvc.perform(patch("/api/v1/demo/me").header("Authorization",auth).contentType("application/json").content(body)).andExpect(status().isConflict());
    }
    @Test void rechargeIsIdempotentAndRejectsKeyReuseWithDifferentPayload() throws Exception {
        var auth=createAccount(phone()); var key=UUID.randomUUID().toString();
        for(int i=0;i<2;i++) mvc.perform(post("/api/v1/demo/recharges").header("Authorization",auth).header("Idempotency-Key",key)
            .contentType("application/json").content("{\"amount\":\"10.00\",\"method\":\"YAPE_DEMO\"}")).andExpect(status().isOk());
        var result=state(auth); assertEquals("22.50",result.get("balance").asText()); assertEquals(1,result.get("recharges").size());
        mvc.perform(post("/api/v1/demo/recharges").header("Authorization",auth).header("Idempotency-Key",key)
            .contentType("application/json").content("{\"amount\":\"20.00\",\"method\":\"YAPE_DEMO\"}")).andExpect(status().isConflict());
    }
    @Test void concurrentRechargesDoNotLoseBalanceUpdates() throws Exception {
        var auth=createAccount(phone());
        try(var executor=Executors.newFixedThreadPool(2)) {
            var first=executor.submit(() -> recharge(auth)); var second=executor.submit(() -> recharge(auth));
            first.get(); second.get();
        }
        assertEquals("32.50",state(auth).get("balance").asText());
        assertEquals(2,state(auth).get("recharges").size());
    }
    private Void recharge(String auth) throws Exception {
        mvc.perform(post("/api/v1/demo/recharges").header("Authorization",auth).header("Idempotency-Key",UUID.randomUUID().toString())
            .contentType("application/json").content("{\"amount\":\"10.00\",\"method\":\"CARD_DEMO\"}")).andExpect(status().isOk()); return null;
    }
    @Test void invalidInputsAreRejectedAndPreferencesPersist() throws Exception {
        mvc.perform(post("/api/v1/demo/sessions").contentType("application/json").content("{\"phone\":\"abc\",\"password\":\"\"}")).andExpect(status().isBadRequest());
        var phone=phone();var auth=createAccount(phone);
        mvc.perform(post("/api/v1/demo/recharges").header("Authorization",auth).header("Idempotency-Key",UUID.randomUUID().toString())
            .contentType("application/json").content("{\"amount\":\"7\",\"method\":\"CARD_DEMO\"}")).andExpect(status().isBadRequest());
        mvc.perform(patch("/api/v1/demo/preferences").header("Authorization",auth).contentType("application/json").content("{\"notifications\":false}")).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/demo/alerts/read-all").header("Authorization",auth)).andExpect(status().isNoContent());
        var persisted=state(login(phone));assertFalse(persisted.get("notifications").asBoolean());assertTrue(persisted.get("alertsRead").asBoolean());
    }
    @Test void assistantContextContainsOnlyThisAccountsSimulatedData() throws Exception {
        var firstPhone = phone();
        var first = createAccount(firstPhone);
        var second = createAccount(phone());
        recharge(first);
        var firstContext = service.assistantContext(sessions.accountId(first));
        var secondContext = service.assistantContext(sessions.accountId(second));
        assertTrue(firstContext.contains("22.50"));
        assertTrue(firstContext.contains("CARD_DEMO"));
        assertFalse(secondContext.contains("22.50"));
        assertTrue(secondContext.contains("12.50"));
        assertFalse(firstContext.contains(firstPhone));
        assertFalse(firstContext.contains("76543210"));
        assertTrue(firstContext.contains("Naranjal"));
    }
    @Test void assistantReportsMissingConfiguration() throws Exception {
        var key = System.getenv("GEMINI_API_KEY");
        assumeTrue(key == null || key.isBlank(), "Requires GEMINI_API_KEY to be unset");
        mvc.perform(post("/api/v1/demo/assistant").header("Authorization", createAccount(phone()))
            .contentType("application/json").content("{\"message\":\"Hola\"}"))
            .andExpect(status().isServiceUnavailable());
    }
    @Test void registrationValidatesAndNormalizesUserInput() throws Exception {
        var phone = phone();
        var input = new java.util.HashMap<>(java.util.Map.of(
            "firstName", "  Ana  María ", "lastName", "  De  la  Torre ",
            "phone", " " + phone + " ", "dni", " 00123456 ",
            "email", " " + phone + "@OUTLOOK.COM ", "password", "ClaveSegura#123"));
        for (var invalid : java.util.Map.of(
                "phone", "12345678", "dni", "1234567", "email", "ana@gmail.com.ejemplo.org",
                "password", "clavesegura123", "lastName", "123").entrySet()) {
            var changed = new java.util.HashMap<>(input);
            changed.put(invalid.getKey(), invalid.getValue());
            mvc.perform(post("/api/v1/demo/register").contentType("application/json")
                .content(mapper.writeValueAsString(changed))).andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/v1/demo/register").contentType("application/json")
            .content(mapper.writeValueAsString(input))).andExpect(status().isOk());
        var account = service.login(phone, "ClaveSegura#123");
        assertEquals("Ana María De la Torre", account.fullName);
        assertEquals(phone + "@outlook.com", account.email);
        assertEquals("00123456", account.dni);
    }
    @Test void registrationHashesPasswordAndRequiresItForLogin() throws Exception {
        var phone = phone();
        var auth = createAccount(phone);
        var account = service.login(phone, "ClaveSegura#123");
        assertTrue(account.passwordHash.startsWith("$argon2id$"));
        assertNotEquals("ClaveSegura#123", account.passwordHash);
        var secondPhone = phone();
        createAccount(secondPhone);
        assertNotEquals(account.passwordHash, storedPassword(secondPhone));
        mvc.perform(post("/api/v1/demo/sessions").contentType("application/json")
            .content(mapper.writeValueAsString(java.util.Map.of(
                "phone", phone, "password", "ClaveIncorrecta123"))))
            .andExpect(status().isUnauthorized());
        assertTrue(state(auth).get("profile").has("fullName"));
        assertFalse(state(auth).has("passwordHash"));
        mvc.perform(post("/api/v1/demo/register").contentType("application/json")
            .content(mapper.writeValueAsString(java.util.Map.of(
                "fullName", "Otra persona",
                "phone", phone(),
                "dni", "12345678",
                "email", phone + "@gmail.com",
                "password", "OtraClaveSegura#123"))))
            .andExpect(status().isConflict());
    }

    @Test void validLoginUpgradesLegacyPasswordWithoutChangingTheProfileVersion() throws Exception {
        var phone = phone();
        var auth = createAccount(phone);
        long version = state(auth).get("profile").get("version").asLong();
        String legacyHash = new BCryptPasswordEncoder().encode("ClaveSegura#123");
        db.update("UPDATE demo_account SET password_hash=? WHERE login_phone=?", legacyHash, phone);

        mvc.perform(post("/api/v1/demo/sessions").contentType("application/json")
            .content(mapper.writeValueAsString(java.util.Map.of(
                "phone", phone, "password", "ClaveIncorrecta#123"))))
            .andExpect(status().isUnauthorized());
        assertEquals(legacyHash, storedPassword(phone));

        assertEquals(version, state(login(phone)).get("profile").get("version").asLong());
        assertTrue(storedPassword(phone).startsWith("$argon2id$"));
        assertEquals("Usuario de prueba", state(login(phone)).get("profile").get("fullName").asText());
    }

    private String storedPassword(String phone) {
        return db.queryForObject("SELECT password_hash FROM demo_account WHERE login_phone=?",
            String.class, phone);
    }
}
