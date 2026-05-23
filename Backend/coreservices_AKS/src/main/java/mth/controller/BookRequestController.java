package mth.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import mth.models.BookRequest;
import mth.services.BookRequestService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/requests")
public class BookRequestController {

	@Autowired private BookRequestService svc;

	/** ?status=pending|approved|rejected|cancelled|all (defaults to all for non-students). */
	@GetMapping
	public List<BookRequest> list(@RequestParam(value = "status", required = false) String status) {
		return svc.list(status);
	}

	/** Body: { resourceId, notes? } */
	@PostMapping
	public BookRequest create(@RequestBody Map<String, Object> body) {
		Long resourceId = body.get("resourceId") == null ? null
				: Long.valueOf(body.get("resourceId").toString());
		String notes = body.get("notes") == null ? null : body.get("notes").toString();
		return svc.create(resourceId, notes);
	}

	/** Body optional: { notes? } — librarian's approval message. */
	@PutMapping("/{id}/approve")
	public BookRequest approve(@PathVariable Long id,
			@RequestBody(required = false) Map<String, Object> body) {
		String notes = (body == null || body.get("notes") == null) ? null : body.get("notes").toString();
		return svc.approve(id, notes);
	}

	/** Body optional: { notes? } — librarian's rejection reason. */
	@PutMapping("/{id}/reject")
	public BookRequest reject(@PathVariable Long id,
			@RequestBody(required = false) Map<String, Object> body) {
		String notes = (body == null || body.get("notes") == null) ? null : body.get("notes").toString();
		return svc.reject(id, notes);
	}

	@PutMapping("/{id}/cancel")
	public BookRequest cancel(@PathVariable Long id) {
		return svc.cancel(id);
	}
}
