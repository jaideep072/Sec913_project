package mth.repository;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import mth.models.Users;

@Repository
public interface UsersRepository extends MongoRepository<Users, String> {

    Optional<Users> findByEmail(String email);

    Optional<Users> findByEmailAndPassword(String email, String password);
}
