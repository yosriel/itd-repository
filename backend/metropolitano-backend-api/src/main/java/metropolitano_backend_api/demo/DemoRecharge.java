package metropolitano_backend_api.demo;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name="demo_recharge")
public class DemoRecharge {
    @Id public String id = UUID.randomUUID().toString();
    @Column(name="account_id") public String accountId;
    @Column(name="request_key") public String requestKey;
    public BigDecimal amount;
    public String method;
    @Column(name="balance_after") public BigDecimal balanceAfter;
    @Column(name="created_at") public Instant createdAt = Instant.now();
    protected DemoRecharge() {}
    DemoRecharge(String accountId, String key, BigDecimal amount, String method, BigDecimal balance) {
        this.accountId=accountId; requestKey=key; this.amount=amount; this.method=method; balanceAfter=balance;
    }
}
