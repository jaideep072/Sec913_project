package mth.security;

/**
 * Per-request snapshot of who is calling the API.
 * Populated by JwtAuthFilter; read by RoleGuard inside controllers/services.
 *
 * Stored in a ThreadLocal so we don't have to pass it around manually.
 */
public class AuthContext {

	private static final ThreadLocal<AuthContext> CURRENT = new ThreadLocal<>();

	private final String email;
	private final String role;
	private final String fullname;

	public AuthContext(String email, String role, String fullname) {
		this.email = email;
		this.role = role;
		this.fullname = fullname;
	}

	public String getEmail() { return email; }
	public String getRole() { return role; }
	public String getFullname() { return fullname; }

	public static void set(AuthContext ctx) { CURRENT.set(ctx); }
	public static AuthContext get() { return CURRENT.get(); }
	public static void clear() { CURRENT.remove(); }
}
