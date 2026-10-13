package metropolitano_backend_api.demo;

import java.math.BigDecimal;
import java.util.*;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;

@Service
@Profile("demo")
public class DemoService {
    private final AccountRepository accounts;
    private final RechargeRepository recharges;
    private final JsonNode fixtures;
    public DemoService(AccountRepository accounts, RechargeRepository recharges, ObjectMapper mapper) throws Exception {
        this.accounts=accounts; this.recharges=recharges;
        try (var stream = new ClassPathResource("demo/fixtures.json").getInputStream()) { fixtures=mapper.readTree(stream); }
    }
    @Transactional
    public DemoAccount login(String phone, String dni) {
        return accounts.findByLoginPhone(phone).orElseGet(() -> accounts.save(new DemoAccount(phone,dni)));
    }
    public record ProfileView(String fullName, String phone, String dni, String email, long version) {}
    public record RechargeView(String id, String amount, String method, String balanceAfter, String createdAt, String dataMode) {}
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
