package metropolitano_backend_api.demo;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface RechargeRepository extends JpaRepository<DemoRecharge,String> {
    Optional<DemoRecharge> findByAccountIdAndRequestKey(String accountId, String key);
    List<DemoRecharge> findTop50ByAccountIdOrderByCreatedAtDesc(String accountId);
}
