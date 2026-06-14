package mth.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import mth.models.Rolesmapping;

@Repository
public class RolesmappingRepository {

    private List<Rolesmapping> mappings = new ArrayList<>();

    public RolesmappingRepository() {
        Rolesmapping r1 = new Rolesmapping(); r1.setRole(1L); r1.setMid(1L);
        Rolesmapping r2 = new Rolesmapping(); r2.setRole(1L); r2.setMid(2L);
        mappings.add(r1);
        mappings.add(r2);
    }

    public List<Rolesmapping> findByRole(Long role) {
        return mappings.stream().filter(r -> r.getRole().equals(role)).collect(Collectors.toList());
    }

    public void save(Rolesmapping r) {
        mappings.add(r);
    }

    public void saveAll(List<Rolesmapping> list) {
        mappings.addAll(list);
    }

    public void deleteByRole(Long role) {
        mappings.removeIf(r -> r.getRole().equals(role));
    }
}
