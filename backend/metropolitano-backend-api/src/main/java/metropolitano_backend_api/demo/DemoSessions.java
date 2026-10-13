package metropolitano_backend_api.demo;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.security.SecureRandom;

@Component
@Profile("demo")
public class DemoSessions {
    private record Session(String accountId, Instant expiresAt) {}
    private final Map<String,Session> sessions = new ConcurrentHashMap<>();
    public String create(String accountId) {
        sessions.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(Instant.now()));
        if (sessions.size() >= 1000) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Limite de sesiones demo");
        byte[] bytes = new byte[32]; new SecureRandom().nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessions.put(token, new Session(accountId, Instant.now().plusSeconds(3600)));
        return token;
    }
    public String accountId(String header) {
        String token = token(header);
        Session session = sessions.get(token);
        if (session == null || session.expiresAt().isBefore(Instant.now())) {
            sessions.remove(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion demo vencida o cerrada");
        }
        return session.accountId();
    }
    public void revoke(String header) { sessions.remove(token(header)); }
    private String token(String header) {
        if (header == null || !header.startsWith("Bearer ")) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia una sesion demo");
        return header.substring(7);
    }
}
