package metropolitano_backend_api.demo;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
@Configuration
@Profile("!demo")
public class ClosedSecurity {
    @Bean SecurityFilterChain closed(HttpSecurity http) throws Exception {
        return http.authorizeHttpRequests(auth -> auth.requestMatchers("/actuator/health").permitAll().anyRequest().denyAll()).build();
    }
}
