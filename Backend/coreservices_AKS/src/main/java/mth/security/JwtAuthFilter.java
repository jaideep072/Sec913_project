package mth.security;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import mth.services.JwtService;

/**
 * Runs once per HTTP request. If the request has a Token header,
 * validate it and populate AuthContext; otherwise leave it unset.
 *
 * The filter is intentionally permissive — it never rejects requests itself.
 * Controllers/services decide what to allow via {@link RoleGuard}.
 * This keeps the public endpoints (signup, signin, swagger) trivially open.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

	private static final Set<String> PUBLIC_PREFIXES = Set.of(
			"/authservice/signup",
			"/authservice/signin",
			"/authservice/test",
			"/swagger-ui",
			"/v3/api-docs"
	);

	@Autowired
	private JwtService jwt;

	@Override
	protected void doFilterInternal(HttpServletRequest req,
			HttpServletResponse res,
			FilterChain chain) throws ServletException, IOException {

		String token = req.getHeader("Token");
		if (token != null && !token.isBlank()) {
			try {
				Map<String, Object> payload = jwt.validateJWT(token);
				String email = (String) payload.get("username");
				String role = (String) payload.get("role");
				AuthContext.set(new AuthContext(email, role));
			} catch (Exception ignored) {
				// Bad/expired token: don't reject here — RoleGuard will throw 401
				// when a protected endpoint is hit.
			}
		}

		try {
			chain.doFilter(req, res);
		} finally {
			AuthContext.clear();
		}
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		String path = request.getRequestURI();
		return PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
	}
}
