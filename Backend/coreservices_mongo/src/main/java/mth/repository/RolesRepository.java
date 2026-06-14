package mth.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import mth.models.Roles;

@Repository
public interface RolesRepository extends MongoRepository<Roles, String> {

    List<Roles> findAll();

    Optional<Roles> findByRole(Long role);

    default Long getMaxRoleId() {
        return findAll().stream()
                .map(Roles::getRole)
                .filter(r -> r != null)
                .mapToLong(Long::longValue)
                .max()
                .orElse(0L);
    }
}
