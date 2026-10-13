package metropolitano_backend_api.demo;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "demo_account")
public class DemoAccount {
    @Id public String id = UUID.randomUUID().toString();
    @Column(name="login_phone", unique=true, nullable=false) public String loginPhone;
    @Column(name="full_name") public String fullName = "Juan Carlos Quispe";
    public String phone;
    public String dni;
    public String email = "juancarlos@example.com";
    public BigDecimal balance = new BigDecimal("12.50");
    public boolean notifications = true;
    @Column(name="alerts_read") public boolean alertsRead;
    @Version public long version;
    protected DemoAccount() {}
    DemoAccount(String phone, String dni) { this.loginPhone = phone; this.phone = phone; this.dni = dni; }
}
