package metropolitano_backend_api.demo;

import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;

public interface AccountRepository extends JpaRepository<DemoAccount,String> {
    Optional<DemoAccount> findByLoginPhone(String phone);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from DemoAccount a where a.id = :id")
    Optional<DemoAccount> lockById(String id);
}
