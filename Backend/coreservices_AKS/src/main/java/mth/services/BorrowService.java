package mth.services;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import mth.models.Borrow;
import mth.repository.BorrowRepository;
import mth.security.AuthContext;
import mth.security.NotFoundException;
import mth.security.RoleGuard;

@Service
public class BorrowService {

	@Autowired private BorrowRepository borrowRepo;

	/**
	 * Returns all borrows for Staff. For Students, returns only their own
	 * borrowing history. Librarians get full visibility too.
	 */
	public List<Borrow> list() {
		RoleGuard.requireLoggedIn();
		String role = AuthContext.get().getRole();

		List<Borrow> rows = "Student".equals(role)
				? borrowRepo.findByBorrowerEmailOrderByBorrowedOnDesc(AuthContext.get().getEmail())
				: borrowRepo.findAllByOrderByBorrowedOnDesc();

		rows.forEach(this::applyStatus);
		return rows;
	}

	/** Staff-only: create a borrow record. */
	public Borrow create(Borrow input) {
		RoleGuard.requireAnyRole("Staff", "Admin");

		if (input.getBookTitle() == null || input.getBookTitle().isBlank())
			throw new IllegalArgumentException("bookTitle is required.");
		if (input.getBorrowerEmail() == null || input.getBorrowerEmail().isBlank())
			throw new IllegalArgumentException("borrowerEmail is required.");
		if (input.getBorrowerName() == null || input.getBorrowerName().isBlank())
			throw new IllegalArgumentException("borrowerName is required.");
		if (input.getBorrowedOn() == null) input.setBorrowedOn(LocalDate.now());
		if (input.getDueDate() == null)    input.setDueDate(input.getBorrowedOn().plusDays(14));
		if (input.getBorrowerRole() == null) input.setBorrowerRole("Student");

		input.setId(null);
		input.setReturnedOn(null);
		Borrow saved = borrowRepo.save(input);
		applyStatus(saved);
		return saved;
	}

	/** Staff-only: mark a borrow as returned (today, unless a date is supplied). */
	public Borrow markReturned(Long id, LocalDate returnedOn) {
		RoleGuard.requireAnyRole("Staff", "Admin");

		Borrow b = borrowRepo.findById(id)
				.orElseThrow(() -> new NotFoundException("Borrow not found: " + id));
		b.setReturnedOn(returnedOn == null ? LocalDate.now() : returnedOn);
		Borrow saved = borrowRepo.save(b);
		applyStatus(saved);
		return saved;
	}

	/** Staff-only: delete a borrow record. */
	public void delete(Long id) {
		RoleGuard.requireAnyRole("Staff", "Admin");
		if (!borrowRepo.existsById(id)) {
			throw new NotFoundException("Borrow not found: " + id);
		}
		borrowRepo.deleteById(id);
	}

	/** Compute the transient {@code status} field from the stored dates. */
	private void applyStatus(Borrow b) {
		if (b.getReturnedOn() != null) {
			b.setStatus("returned");
		} else if (b.getDueDate() != null && b.getDueDate().isBefore(LocalDate.now())) {
			b.setStatus("overdue");
		} else {
			b.setStatus("active");
		}
	}
}
