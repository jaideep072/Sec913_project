package mth.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import mth.models.Rolesmapping;

@Repository
public interface RolesmappingRepository extends MongoRepository<Rolesmapping, String> {

    List<Rolesmapping> findByRole(Long role);

    Optional<Rolesmapping> findByRoleAndMid(Long role, Long mid);

    void deleteByRole(Long role);
}
