package mth.config;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import mth.models.Menus;
import mth.models.Roles;
import mth.models.Rolesmapping;
import mth.repository.MenusRepository;
import mth.repository.RolesRepository;
import mth.repository.RolesmappingRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private MenusRepository menusRepo;

    @Autowired
    private RolesRepository rolesRepo;

    @Autowired
    private RolesmappingRepository mappingRepo;

    @Override
    public void run(String... args) throws Exception {
        try {
            // 1. Ensure "Roles" menu exists
            List<Menus> allMenus = menusRepo.findAll();
            Optional<Menus> rolesMenuOpt = allMenus.stream()
                    .filter(m -> m.getMenu() != null && m.getMenu().equalsIgnoreCase("Roles"))
                    .findFirst();

            Menus rolesMenu;
            if (rolesMenuOpt.isPresent()) {
                rolesMenu = rolesMenuOpt.get();
                System.out.println("[DataInitializer] 'Roles' menu already present (mid=" + rolesMenu.getMid() + ")");
            } else {
                rolesMenu = new Menus();
                Menus topMenu = menusRepo.findTopByOrderByMidDesc();
                Long nextMid = (topMenu != null && topMenu.getMid() != null) ? topMenu.getMid() + 1 : 1L;
                rolesMenu.setMid(nextMid);
                rolesMenu.setMenu("Roles");
                rolesMenu.setIcon("menu.png");
                menusRepo.save(rolesMenu);
                System.out.println("[DataInitializer] Inserted 'Roles' menu with mid=" + nextMid);
            }

            // 2. Ensure Admin role (id 3) exists
            Optional<Roles> adminOpt = rolesRepo.findByRole(3L);
            if (!adminOpt.isPresent()) {
                Roles admin = new Roles();
                admin.setRole(3L);
                admin.setRolename("Admin");
                rolesRepo.save(admin);
                System.out.println("[DataInitializer] Inserted default Admin role (id=3)");
            }

            // 3. Ensure Admin role is mapped to "Roles" menu
            List<Rolesmapping> existing = mappingRepo.findByRole(3L);
            boolean alreadyMapped = existing.stream()
                    .anyMatch(rm -> rm.getMid() != null && rm.getMid().equals(rolesMenu.getMid()));

            if (!alreadyMapped) {
                Rolesmapping rm = new Rolesmapping();
                rm.setRole(3L);
                rm.setMid(rolesMenu.getMid());
                mappingRepo.save(rm);
                System.out.println("[DataInitializer] Mapped 'Roles' menu (mid="
                        + rolesMenu.getMid() + ") to Admin role (3)");
            } else {
                System.out.println("[DataInitializer] 'Roles' menu already mapped to Admin role.");
            }
        } catch (Exception e) {
            System.err.println("[DataInitializer] Seed failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
