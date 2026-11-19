package metropolitano_backend_api.demo;

import java.math.BigDecimal;
import java.util.*;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;

@Service
@Profile("demo")
public class DemoService {
    private final AccountRepository accounts;
    private final RechargeRepository recharges;
    private final PasswordEncoder passwordEncoder;
    private final JsonNode fixtures;
    public DemoService(AccountRepository accounts, RechargeRepository recharges,
        PasswordEncoder passwordEncoder, ObjectMapper mapper) throws Exception {
        this.accounts=accounts; this.recharges=recharges;
        this.passwordEncoder=passwordEncoder;
        try (var stream = new ClassPathResource("demo/fixtures.json").getInputStream()) { fixtures=mapper.readTree(stream); }
    }
    @Transactional
    public DemoAccount register(String fullName, String phone, String dni,
        String email, String password) {
        if (accounts.existsByLoginPhone(phone) || phone.equals("987654321")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ese celular ya tiene una cuenta");
        }
        if (accounts.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Ese correo ya tiene una cuenta");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "La contraseña excede el máximo permitido");
        }
        var account = new DemoAccount(phone, dni);
        account.fullName = fullName.trim();
        account.email = email.trim().toLowerCase(Locale.ROOT);
        account.passwordHash = passwordEncoder.encode(password);
        return accounts.save(account);
    }
    @Transactional(readOnly=true)
    public DemoAccount login(String phone, String password) {
        var account = accounts.findByLoginPhone(phone).orElse(null);
        if (account == null || account.passwordHash == null
            || !passwordEncoder.matches(password, account.passwordHash)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "Celular o contraseña incorrectos");
        }
        return account;
    }
    @Transactional
    public DemoAccount presentationAccount() {
        return accounts.findByLoginPhone("987654321")
            .orElseGet(() -> accounts.save(new DemoAccount("987654321", "76543210")));
    }
    public record ProfileView(String fullName, String phone, String dni, String email, long version) {}
    public record RechargeView(String id, String amount, String method, String balanceAfter, String createdAt, String dataMode) {}
    @Transactional(readOnly=true)
    public String assistantContext(String accountId) {
        var account = accounts.findById(accountId).orElseThrow();
        var recentRecharges = recharges.findTop50ByAccountIdOrderByCreatedAtDesc(accountId).stream()
            .limit(5).map(r -> Map.of("amount", r.amount.toPlainString(), "method", r.method,
                "balanceAfter", r.balanceAfter.toPlainString())).toList();
        return "Estaciones, rutas y alertas de ejemplo (no son datos en vivo): " +
            Map.of("stations", fixtures.get("stations"), "alerts", fixtures.get("alerts"), "rutas", fixtures.get("rutas")) +
            ". Las llegadas por andén son simuladas, derivadas de las líneas de las rutas y no representan horarios reales. " +
            "La ubicación, el viaje, el QR, las notificaciones y las recargas son simulados. " +
            "La recarga admite S/ 5, 10, 20 o 50 con Yape demo o tarjeta demo; no hay pasarela, cobro ni acreditación física. " +
            "Saldo ficticio de esta sesión: S/ " + account.balance.toPlainString() +
            ". Últimas recargas simuladas registradas (máximo 5): " + recentRecharges;
    }
    private ProfileView profile(DemoAccount a) { return new ProfileView(a.fullName,a.phone,a.dni,a.email,a.version); }
    private RechargeView rechargeView(DemoRecharge r) { return new RechargeView(r.id,r.amount.toPlainString(),r.method,r.balanceAfter.toPlainString(),r.createdAt.toString(),"SIMULATED"); }
    @Transactional(readOnly=true)
    public Map<String,Object> state(String id) {
        var a = accounts.findById(id).orElseThrow();
        return Map.of("profile",profile(a),"balance",a.balance.toPlainString(),"notifications",a.notifications,
            "alertsRead",a.alertsRead,"fixtures",fixtures,"recharges",recharges.findTop50ByAccountIdOrderByCreatedAtDesc(id).stream().map(this::rechargeView).toList(),"dataMode","SIMULATED");
    }
    @Transactional
    public ProfileView update(String id, DemoController.ProfileInput input) {
        var a = accounts.lockById(id).orElseThrow();
        if (a.version != input.version()) throw new ResponseStatusException(HttpStatus.CONFLICT,"El perfil cambio; vuelve a cargarlo");
        a.fullName=input.fullName().trim(); a.phone=input.phone(); a.dni=input.dni(); a.email=input.email().trim();
        accounts.flush();
        return profile(a);
    }
    @Transactional
    public void preferences(String id, boolean enabled) { accounts.lockById(id).orElseThrow().notifications=enabled; }
    @Transactional
    public void readAlerts(String id) { accounts.lockById(id).orElseThrow().alertsRead=true; }
    @Transactional
    public RechargeView recharge(String id, String key, DemoController.RechargeInput input) {
        var a = accounts.lockById(id).orElseThrow();
        var old = recharges.findByAccountIdAndRequestKey(id,key);
        if (old.isPresent()) {
            var r = old.get();
            if (r.amount.compareTo(input.amount())!=0 || !r.method.equals(input.method())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Clave de recarga utilizada con otros datos");
            return rechargeView(r);
        }
        if (List.of(5,10,20,50).stream().noneMatch(n -> input.amount().compareTo(BigDecimal.valueOf(n))==0))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Monto demo no permitido");
        a.balance=a.balance.add(input.amount()).setScale(2);
        return rechargeView(recharges.save(new DemoRecharge(id,key,input.amount().setScale(2),input.method(),a.balance)));
    }
}
