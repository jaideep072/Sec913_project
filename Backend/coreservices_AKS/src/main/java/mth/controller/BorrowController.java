package mth.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import mth.models.Borrow;
import mth.services.BorrowService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/borrows")
public class BorrowController {

	@Autowired private BorrowService svc;

	@GetMapping
	public List<Borrow> list() {
		return svc.list();
	}

	@PostMapping
	public Borrow create(@RequestBody Borrow body) {
		return svc.create(body);
	}

	/** Body may include {"returnedOn": "yyyy-MM-dd"}; missing → today. */
	@PutMapping("/{id}/return")
	public Borrow markReturned(@PathVariable Long id,
			@RequestBody(required = false) Map<String, String> body) {
		LocalDate when = null;
		if (body != null && body.get("returnedOn") != null && !body.get("returnedOn").isBlank()) {
			when = LocalDate.parse(body.get("returnedOn"));
		}
		return svc.markReturned(id, when);
	}

	@DeleteMapping("/{id}")
	public Map<String, Object> delete(@PathVariable Long id) {
		svc.delete(id);
		return Map.of("code", 200, "message", "Borrow deleted.");
	}
}
