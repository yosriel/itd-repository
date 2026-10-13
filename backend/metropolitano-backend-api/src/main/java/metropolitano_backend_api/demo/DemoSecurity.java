package metropolitano_backend_api.demo;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Profile("demo")
public class DemoSecurity {
    @Bean
    SecurityFilterChain security(HttpSecurity http) throws Exception {
        // Bearer-only demo endpoints authorize in DemoSessions; no cookie authentication.
        return http.csrf(csrf -> csrf.ignoringRequestMatchers("/api/v1/demo/**"))
            .authorizeHttpRequests(auth -> auth.requestMatchers("/api/v1/demo/**", "/actuator/health", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .anyRequest().denyAll()).build();
    }
}
