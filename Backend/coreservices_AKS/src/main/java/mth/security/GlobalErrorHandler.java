package mth.security;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Translates exceptions thrown out of controllers/services into uniform
 * { code, message } JSON bodies that match the rest of the API.
 */
@RestControllerAdvice
public class GlobalErrorHandler {

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<Map<String, Object>> denied(AccessDeniedException e) {
		Map<String, Object> body = new HashMap<>();
		// 401 if no auth at all, 403 if logged in but wrong role
		HttpStatus status = AuthContext.get() == null ? HttpStatus.UNAUTHORIZED : HttpStatus.FORBIDDEN;
		body.put("code", status.value());
		body.put("message", e.getMessage());
		return ResponseEntity.status(status).body(body);
	}

	@ExceptionHandler(NotFoundException.class)
	public ResponseEntity<Map<String, Object>> notFound(NotFoundException e) {
		Map<String, Object> body = new HashMap<>();
		body.put("code", 404);
		body.put("message", e.getMessage());
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<Map<String, Object>> badRequest(IllegalArgumentException e) {
		Map<String, Object> body = new HashMap<>();
		body.put("code", 400);
		body.put("message", e.getMessage());
		return ResponseEntity.badRequest().body(body);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> unexpected(Exception e) {
		Map<String, Object> body = new HashMap<>();
		body.put("code", 500);
		body.put("message", e.getMessage());
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
	}
}
