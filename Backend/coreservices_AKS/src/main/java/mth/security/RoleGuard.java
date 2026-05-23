package mth.security;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Tiny helper controllers call to enforce role checks:
 *
 *     RoleGuard.requireRole("Librarian");
 *     RoleGuard.requireAnyRole("Librarian", "Staff");
 *
 * Throws {@link AccessDeniedException} if the current request isn't authorized.
 */
public final class RoleGuard {

	private RoleGuard() { /* static helpers only */ }

	/** Must be logged in (any role). */
	public static void requireLoggedIn() {
		AuthContext ctx = AuthContext.get();
		if (ctx == null) {
			throw new AccessDeniedException("Authentication required.");
		}
	}

	/** Must be logged in AND have the given role. */
	public static void requireRole(String role) {
		requireAnyRole(role);
	}

	/** Must be logged in AND have one of the given roles. */
	public static void requireAnyRole(String... roles) {
		AuthContext ctx = AuthContext.get();
		if (ctx == null) {
			throw new AccessDeniedException("Authentication required.");
		}
		Set<String> allowed = new HashSet<>(Arrays.asList(roles));
		if (!allowed.contains(ctx.getRole())) {
			throw new AccessDeniedException(
					"Forbidden: this action is restricted to " + String.join("/", roles) + ".");
		}
	}
}
