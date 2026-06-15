package mth.controller;

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

import mth.services.UsersService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/admin/users")
public class AdminUsersController {

	@Autowired
	UsersService US;

	@GetMapping
	public Object listUsers() {
		return US.getAllUsers();
	}

	@PutMapping("/{userId}/role")
	public Object setRole(@PathVariable String userId, @RequestBody Map<String, Object> body) {
		String roleName = body.get("role") != null ? body.get("role").toString() : null;
		return US.setUserRole(userId, roleName);
	}

	@PutMapping("/{userId}/status")
	public Object setStatus(@PathVariable String userId, @RequestBody Map<String, Object> body) {
		int status = body.get("status") != null ? Integer.parseInt(body.get("status").toString()) : 0;
		return US.setUserStatus(userId, status);
	}

	@DeleteMapping("/{userId}")
	public Object deleteUser(@PathVariable String userId) {
		return US.deleteUser(userId);
	}
}
