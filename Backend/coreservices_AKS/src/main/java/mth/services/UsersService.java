package mth.services;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import mth.models.Users;
import mth.repository.UsersRepository;

/**
 * Account lifecycle (signup / signin / uinfo).
 *
 * Returns plain Map<String,Object> bodies so the gateway can forward them
 * verbatim to the React app — every response carries a `code` field that
 * mirrors HTTP status semantics (200 = ok, 4xx-ish = client error, 500 = server error).
 */
@Service
public class UsersService {

	/** All roles the system knows about — used for token-level validation. */
	private static final Set<String> ALLOWED_ROLES = Set.of("Student", "Librarian", "Staff", "Admin");

	/** Roles a user is allowed to pick when signing up themselves. */
	private static final Set<String> SELF_SIGNUP_ROLES = Set.of("Student", "Librarian", "Staff");

	@Autowired
	private UsersRepository UR;

	@Autowired
	private JwtService JWT;

	public Map<String, Object> signup(Users U) {
		Map<String, Object> response = new HashMap<>();
		try {
			if (U.getEmail() == null || U.getPassword() == null || U.getFullname() == null) {
				response.put("code", 400);
				response.put("message", "Full name, email and password are required.");
				return response;
			}

			// Self-signup may only choose from the public roles. Any attempt to
			// post role="Admin" (or anything else funky) is silently downgraded
			// to Student so the API stays well-behaved without leaking which
			// roles even exist.
			String role = U.getRole();
			if (role == null || !SELF_SIGNUP_ROLES.contains(role)) {
				role = "Student";
			}

			if (UR.existsByEmail(U.getEmail())) {
				response.put("code", 501);
				response.put("message", "Email ID already registered");
				return response;
			}

			U.setRole(role);
			U.setStatus(1);
			UR.save(U);

			response.put("code", 200);
			response.put("message", "User account has been created.");
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}

	public Map<String, Object> signin(Map<String, Object> data) {
		Map<String, Object> response = new HashMap<>();
		try {
			String username = data.get("username") == null ? null : data.get("username").toString();
			String password = data.get("password") == null ? null : data.get("password").toString();

			Optional<Users> hit = UR.findByEmail(username)
					.filter(u -> u.getPassword() != null && u.getPassword().equals(password));

			if (hit.isPresent()) {
				Users u = hit.get();
				response.put("code", 200);
				response.put("jwt", JWT.generateJWT(u.getEmail(), u.getRole()));
				response.put("role", u.getRole());
				response.put("fullname", u.getFullname());
				response.put("id", u.getId());
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

	public Map<String, Object> uinfo(String token) {
		Map<String, Object> response = new HashMap<>();
		try {
			Map<String, Object> payload = JWT.validateJWT(token);
			String email = (String) payload.get("username");

			Users u = UR.findByEmail(email)
					.orElseThrow(() -> new Exception("User not found."));

			response.put("code", 200);
			response.put("id", u.getId());
			response.put("fullname", u.getFullname());
			response.put("email", u.getEmail());
			response.put("phone", u.getPhone());
			response.put("role", u.getRole());
		} catch (Exception e) {
			response.put("code", 401);
			response.put("message", e.getMessage());
		}
		return response;
	}
}
