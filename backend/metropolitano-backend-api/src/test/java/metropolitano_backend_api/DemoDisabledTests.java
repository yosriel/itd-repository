package metropolitano_backend_api;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@ActiveProfiles("locked")
@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:closed-test;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class DemoDisabledTests {
    @Autowired MockMvc mvc;
    @Test void demoAndDocumentationAreDeniedWithoutDemoProfile() throws Exception {
        mvc.perform(post("/api/v1/demo/sessions").contentType("application/json").content("{\"phone\":\"987654321\",\"dni\":\"76543210\"}")).andExpect(status().isForbidden());
        mvc.perform(get("/v3/api-docs")).andExpect(status().isForbidden());
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
