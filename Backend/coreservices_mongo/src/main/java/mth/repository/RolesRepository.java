package mth.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import mth.models.Roles;

@Repository
public class RolesRepository {

    private List<Roles> rolesList = new ArrayList<>();

    public RolesRepository() {
        Roles r1 = new Roles(); r1.setRole(1L); r1.setRolename("Librarian");
        Roles r2 = new Roles(); r2.setRole(2L); r2.setRolename("Admin");
        rolesList.add(r1);
        rolesList.add(r2);
    }

    public List<Roles> findAll() {
        return rolesList;
    }

    public Optional<Roles> findByRole(Long role) {
        return rolesList.stream().filter(r -> r.getRole().equals(role)).findFirst();
    }

    public void save(Roles r) {
        rolesList.add(r);
    }

    public void delete(Roles r) {
        rolesList.remove(r);
    }

    public void deleteById(String id) {
        rolesList.removeIf(r -> id.equals(r.getId()));
    }

    public Long getMaxRoleId() {
        return findAll().stream()
                .map(Roles::getRole)
                .filter(r -> r != null)
                .mapToLong(Long::longValue)
                .max()
                .orElse(0L);
    }
}
