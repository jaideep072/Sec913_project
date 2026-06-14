package mth.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import mth.models.Menus;
import mth.models.Rolesmapping;
import mth.models.Users;
import mth.repository.MenusRepository;
import mth.repository.RolesmappingRepository;
import mth.repository.UsersRepository;

@Service
public class UsersService {

    @Autowired
    UsersRepository UR;

    @Autowired
    MenusRepository MR;

    @Autowired
    RolesmappingRepository RMR;

    @Autowired
    JwtService JWT;

    public Object signup(Users U) {
        Map<String, Object> response = new HashMap<>();
        try {
            Optional<Users> existing = UR.findByEmail(U.getEmail());
            if (existing.isPresent()) {
                response.put("code", 501);
                response.put("message", "Email ID already registered");
            } else {
                if (U.getRole() <= 0) {
                    U.setRole(1);       // default role
                }
                U.setStatus(1);     // active
                UR.save(U);
                response.put("code", 200);
                response.put("message", "User account has been created.");
            }
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", e.getMessage());
        }
        return response;
    }

    public Object signin(Map<String, Object> data) {
        Map<String, Object> response = new HashMap<>();
        try {
            String username = data.get("username").toString();
            String password = data.get("password").toString();

            Optional<Users> userOpt = UR.findByEmailAndPassword(username, password);
            if (userOpt.isPresent()) {
                Users user = userOpt.get();
                response.put("code", 200);
                response.put("jwt", JWT.generateJWT(username, user.getRole()));
            } else {
                response.put("code", 404);
                response.put("message", "Invalid Credentials!");
            }
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", e.getMessage());
        }
        return response;
    }

    public Object uinfo(String token) {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> payload = JWT.validateJWT(token);
            String email = (String) payload.get("username");

            Optional<Users> userOpt = UR.findByEmail(email);
            if (!userOpt.isPresent()) {
                response.put("code", 404);
                response.put("message", "User not found");
                return response;
            }
            Users U = userOpt.get();

            // Get menus for this user's role via Rolesmapping
            List<Rolesmapping> mappings = RMR.findByRole((long) U.getRole());
            List<Long> mids = mappings.stream().map(Rolesmapping::getMid).collect(Collectors.toList());
            List<Menus> menuList = MR.findAll().stream()
                    .filter(m -> mids.contains(m.getMid()))
                    .collect(Collectors.toList());

            response.put("code", 200);
            response.put("fullname", U.getFullname());
            response.put("email", U.getEmail());
            response.put("phone", U.getPhone());
            response.put("role", U.getRole());
            response.put("menulist", menuList);
        } catch (Exception e) {
            response.put("code", 500);
            response.put("message", e.getMessage());
        }
        return response;
    }

    public Object getAllUsers() {
        return UR.findAll();
    }
}
