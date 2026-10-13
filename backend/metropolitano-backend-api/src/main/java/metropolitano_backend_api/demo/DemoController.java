package metropolitano_backend_api.demo;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Profile("demo")
@RequestMapping("/api/v1/demo")
public class DemoController {
    private final DemoSessions sessions;
    private final DemoService service;
    public DemoController(DemoSessions sessions, DemoService service) { this.sessions=sessions; this.service=service; }
    public record LoginInput(@Pattern(regexp="9[0-9]{8}") @NotBlank String phone, @Pattern(regexp="[0-9]{8}") @NotBlank String dni) {}
    public record ProfileInput(@NotBlank @Size(max=100) String fullName, @NotBlank @Pattern(regexp="9[0-9]{8}") String phone,
        @NotBlank @Pattern(regexp="[0-9]{8}") String dni, @NotBlank @Email @Size(max=254) String email, @PositiveOrZero long version) {}
    public record PreferencesInput(boolean notifications) {}
    public record RechargeInput(@NotNull @DecimalMin("5") @DecimalMax("50") @Digits(integer=2,fraction=2) BigDecimal amount,
        @NotBlank @Pattern(regexp="YAPE_DEMO|CARD_DEMO") String method) {}
    @PostMapping("/sessions")
    public Map<String,String> login(@Valid @RequestBody LoginInput input) {
        var a = service.login(input.phone(),input.dni());
        return Map.of("token",sessions.create(a.id),"dataMode","SIMULATED");
    }
    @DeleteMapping("/sessions/current") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value="Authorization",required=false) String header) { sessions.accountId(header); sessions.revoke(header); }
    @GetMapping("/state")
    public Map<String,Object> state(@RequestHeader(value="Authorization",required=false) String header) { return service.state(sessions.accountId(header)); }
    @PatchMapping("/me")
    public DemoService.ProfileView update(@RequestHeader(value="Authorization",required=false) String header, @Valid @RequestBody ProfileInput input) { return service.update(sessions.accountId(header),input); }
    @PatchMapping("/preferences") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void preferences(@RequestHeader(value="Authorization",required=false) String header, @RequestBody PreferencesInput input) { service.preferences(sessions.accountId(header),input.notifications()); }
    @PostMapping("/alerts/read-all") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@RequestHeader(value="Authorization",required=false) String header) { service.readAlerts(sessions.accountId(header)); }
    @PostMapping("/recharges")
    public DemoService.RechargeView recharge(@RequestHeader(value="Authorization",required=false) String header,
        @RequestHeader("Idempotency-Key") String key, @Valid @RequestBody RechargeInput input) {
        if (!key.matches("[a-zA-Z0-9-]{8,64}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Clave de recarga invalida");
        return service.recharge(sessions.accountId(header),key,input);
    }
}
