package metropolitano_backend_api.demo;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AccountRepository extends JpaRepository<DemoAccount,String> {
    Optional<DemoAccount> findByLoginPhone(String phone);
    boolean existsByLoginPhone(String phone);
    boolean existsByEmailIgnoreCase(String email);
    @Query(value = "SELECT * FROM demo_account WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<DemoAccount> lockById(String id);
}
