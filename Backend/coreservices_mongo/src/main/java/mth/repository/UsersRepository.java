package mth.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import mth.models.Users;

@Repository
public class UsersRepository {

    private List<Users> users = new ArrayList<>();

    public Optional<Users> findByEmail(String email) {
        return users.stream().filter(u -> u.getEmail().equals(email)).findFirst();
    }

    public Optional<Users> findByEmailAndPassword(String email, String password) {
        return users.stream().filter(u -> u.getEmail().equals(email) && u.getPassword().equals(password)).findFirst();
    }

    public Optional<Users> findById(String id) {
        return users.stream().filter(u -> id.equals(u.getId())).findFirst();
    }

    public void save(Users u) {
        if (u.getId() == null) {
            u.setId(java.util.UUID.randomUUID().toString());
        }
        users.add(u);
    }

    public void delete(Users u) {
        users.remove(u);
    }

    public List<Users> findAll() {
        return users;
    }
}
