package mth.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import mth.models.Roles;
import mth.repository.RolesRepository;

@RestController
@RequestMapping("/roles")
@CrossOrigin(origins = "*")
public class RolesController {

	@Autowired
	RolesRepository repo;

	@GetMapping
	public List<Roles> getRoles() {
		return repo.findAll();
	}

	@PostMapping
	public Object addRole(@RequestBody Roles role) {
		Map<String, Object> response = new HashMap<>();
		try {
			if (role.getRolename() == null || role.getRolename().trim().isEmpty()) {
				response.put("code", 400);
				response.put("message", "Role name is required");
				return response;
			}

			// Auto-assign next role id (PK is not auto-generated on the entity)
			if (role.getRole() == null) {
				Roles topRole = repo.findTopByOrderByRoleDesc();
				Long nextId = (topRole != null && topRole.getRole() != null) ? topRole.getRole() + 1 : 1L;
				role.setRole(nextId);
			}

			repo.save(role);
			response.put("code", 200);
			response.put("message", "Role added successfully");
			response.put("role", role);
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}
}
