package mth.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import mth.models.Menus;

@Repository
public interface MenusRepository extends MongoRepository<Menus, String> {

    Menus findTopByOrderByMidDesc();
}
