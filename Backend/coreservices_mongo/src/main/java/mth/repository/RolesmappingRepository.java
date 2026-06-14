package mth.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import mth.models.Rolesmapping;

@Repository
public interface RolesmappingRepository extends MongoRepository<Rolesmapping, String> {

    List<Rolesmapping> findByRole(Long role);

    void deleteByRole(Long role);
}
