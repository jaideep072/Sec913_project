package mth.repository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Repository;

import mth.models.Menus;

@Repository
public class MenusRepository {

    private List<Menus> menus = new ArrayList<>();

    public MenusRepository() {
        Menus m1 = new Menus(); m1.setMid(1L); m1.setMenu("Dashboard"); m1.setIcon("dashboard");
        Menus m2 = new Menus(); m2.setMid(2L); m2.setMenu("Search"); m2.setIcon("search");
        menus.add(m1);
        menus.add(m2);
    }

    public List<Menus> findAll() {
        return menus;
    }

    public void save(Menus m) {
        menus.add(m);
    }

    public Long getMaxMenuId() {
        return findAll().stream()
                .map(Menus::getMid)
                .filter(mid -> mid != null)
                .mapToLong(Long::longValue)
                .max()
                .orElse(0L);
    }
}
