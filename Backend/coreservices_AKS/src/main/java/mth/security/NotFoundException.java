package mth.security;

/** Service-layer 404. Mapped to HTTP 404 by {@link GlobalErrorHandler}. */
public class NotFoundException extends RuntimeException {
	private static final long serialVersionUID = 1L;

	public NotFoundException(String msg) {
		super(msg);
	}
}
