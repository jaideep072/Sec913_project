package mth.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import mth.models.Roles;

@Repository
public interface RolesRepository extends MongoRepository<Roles, String> {

    Optional<Roles> findByRole(Long role);

    Roles findTopByOrderByRoleDesc();
}
