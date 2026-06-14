package mth.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import mth.models.Menus;

@Repository
public interface MenusRepository extends MongoRepository<Menus, String> {

    List<Menus> findAll();

    default Long getMaxMenuId() {
        return findAll().stream()
                .map(Menus::getMid)
                .filter(mid -> mid != null)
                .mapToLong(Long::longValue)
                .max()
                .orElse(0L);
    }
}
