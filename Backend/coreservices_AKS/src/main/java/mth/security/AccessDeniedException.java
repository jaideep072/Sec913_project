package mth.security;

/**
 * Thrown by {@link RoleGuard} when the caller is missing a required role.
 * Mapped to HTTP 401/403 by {@link GlobalErrorHandler}.
 */
public class AccessDeniedException extends RuntimeException {
	private static final long serialVersionUID = 1L;

	public AccessDeniedException(String msg) {
		super(msg);
	}
}
