package metropolitano_backend_api.demo;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Component
@Profile("demo")
public class DemoSessions {
    private final JdbcTemplate db;
    private final SecureRandom random = new SecureRandom();

    public DemoSessions(JdbcTemplate db) { this.db = db; }

    @Transactional
    public String create(String accountId) {
        long now = Instant.now().getEpochSecond();
        db.queryForObject("SELECT id FROM demo_session_guard WHERE id=1 FOR UPDATE", Integer.class);
        db.update("DELETE FROM demo_session WHERE expires_at <= ?", now);
        if (db.queryForObject("SELECT COUNT(*) FROM demo_session", Long.class) >= 1000) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Limite de sesiones demo");
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        db.update("INSERT INTO demo_session(token_hash,account_id,expires_at) VALUES (?,?,?)",
            digest(token), accountId, now + 3600);
        return token;
    }

    public String accountId(String header) {
        var accounts = db.queryForList(
            "SELECT account_id FROM demo_session WHERE token_hash=? AND expires_at>?",
            String.class, tokenHash(header), Instant.now().getEpochSecond());
        if (accounts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesion demo vencida o cerrada");
        }
        return accounts.getFirst();
    }

    public void revoke(String header) {
        db.update("DELETE FROM demo_session WHERE token_hash=?", tokenHash(header));
    }

    private String tokenHash(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia una sesion demo");
        }
        return digest(header.substring(7));
    }

    private String digest(String token) {
        try {
            var sha = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(sha.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
