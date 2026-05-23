package mth.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import mth.models.Users;
import mth.services.AdminService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/admin")
public class AdminController {

	@Autowired private AdminService svc;

	@GetMapping("/users")
	public List<Users> listUsers() {
		return svc.listUsers();
	}

	@PutMapping("/users/{id}/role")
	public Users setRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
		return svc.setUserRole(id, body.get("role"));
	}

	@PutMapping("/users/{id}/status")
	public Users setStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
		int status = body.get("status") == null ? 1
				: Integer.parseInt(body.get("status").toString());
		return svc.setUserStatus(id, status);
	}

	@DeleteMapping("/users/{id}")
	public Map<String, Object> deleteUser(@PathVariable Long id) {
		svc.deleteUser(id);
		return Map.of("code", 200, "message", "User deleted.");
	}

	@GetMapping("/audit")
	public Map<String, Object> audit() {
		return svc.audit();
	}
}
