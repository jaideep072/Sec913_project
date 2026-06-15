package mth.services;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import mth.models.BookRequest;
import mth.models.BookRequest.Status;
import mth.models.Borrow;
import mth.models.Resource;
import mth.models.Users;
import mth.repository.BookRequestRepository;
import mth.repository.BorrowRepository;
import mth.repository.ResourceRepository;
import mth.repository.UsersRepository;
import mth.security.AccessDeniedException;
import mth.security.AuthContext;
import mth.security.NotFoundException;
import mth.security.RoleGuard;

/**
 * Request lifecycle (simplified — no admin second step):
 *
 *   Student creates → PENDING
 *   Librarian approves → APPROVED  (borrow is created immediately)
 *   Anyone with the right role can REJECT at any step
 *   Student can CANCEL while still PENDING
 */
@Service
public class BookRequestService {

	@Autowired private BookRequestRepository requestRepo;
	@Autowired private ResourceRepository resourceRepo;
	@Autowired private BorrowRepository borrowRepo;
	@Autowired private UsersRepository usersRepo;

	public List<BookRequest> list(String statusFilter) {
		RoleGuard.requireLoggedIn();
		String role = AuthContext.get().getRole();

		if ("Student".equals(role)) {
			return requestRepo.findByStudentEmailOrderByCreatedAtDesc(AuthContext.get().getEmail());
		}
		if (statusFilter != null && !statusFilter.isBlank() && !"all".equalsIgnoreCase(statusFilter)) {
			Status s;
			try { s = Status.valueOf(statusFilter.toUpperCase()); }
			catch (Exception e) { throw new IllegalArgumentException("Unknown status: " + statusFilter); }
			return requestRepo.findByStatusOrderByCreatedAtDesc(s);
		}
		return requestRepo.findAllByOrderByCreatedAtDesc();
	}

	public BookRequest create(Long resourceId, String notes) {
		RoleGuard.requireAnyRole("Student", "Admin");

		if (resourceId == null) throw new IllegalArgumentException("resourceId is required.");
		Resource r = resourceRepo.findById(resourceId)
				.orElseThrow(() -> new NotFoundException("Resource not found: " + resourceId));

		String email = AuthContext.get().getEmail();
		String fullname = AuthContext.get().getFullname();
		if (fullname == null || fullname.isBlank()) {
			fullname = "Student"; // Fallback if missing
		}

		BookRequest br = new BookRequest();
		br.setResourceId(r.getId());
		br.setResourceTitle(r.getTitle());
		br.setStudentEmail(email);
		br.setStudentName(fullname);
		br.setNotes(notes == null ? "" : notes);
		br.setStatus(Status.PENDING);
		return requestRepo.save(br);
	}

	public BookRequest cancel(Long id) {
		RoleGuard.requireLoggedIn();
		BookRequest br = requestRepo.findById(id)
				.orElseThrow(() -> new NotFoundException("Request not found: " + id));

		String role = AuthContext.get().getRole();
		String email = AuthContext.get().getEmail();
		if (!"Admin".equals(role) && !br.getStudentEmail().equals(email)) {
			throw new AccessDeniedException("You can only cancel your own requests.");
		}
		if (br.getStatus() != Status.PENDING) {
			throw new IllegalArgumentException("Only pending requests can be cancelled.");
		}
		br.setStatus(Status.CANCELLED);
		br.setDecisionAt(Instant.now());
		return requestRepo.save(br);
	}

	/**
	 * Librarian (or Admin) approves a pending (or legacy AWAITING_ADMIN) request.
	 * Side-effect: a Borrow row is auto-created with a default 14-day due date.
	 * No second admin step — this single action finalizes everything.
	 */
	public BookRequest approve(Long id, String decisionNotes) {
		RoleGuard.requireAnyRole("Librarian", "Admin");
		BookRequest br = requestRepo.findById(id)
				.orElseThrow(() -> new NotFoundException("Request not found: " + id));

		// Accept both PENDING and legacy AWAITING_ADMIN rows
		if (br.getStatus() != Status.PENDING && br.getStatus() != Status.AWAITING_ADMIN) {
			throw new IllegalArgumentException("Request is already " + br.getStatus() + ".");
		}

		Optional<Resource> resource = resourceRepo.findById(br.getResourceId());

		Borrow b = new Borrow();
		b.setResourceId(br.getResourceId());
		b.setBookTitle(br.getResourceTitle());
		b.setBookAuthor(resource.map(Resource::getAuthor).orElse(null));
		b.setSection(resource.map(Resource::getSectionId).orElse(null));
		b.setBorrowerEmail(br.getStudentEmail());
		b.setBorrowerName(br.getStudentName());
		b.setBorrowerRole("Student");
		b.setBorrowedOn(LocalDate.now());
		b.setDueDate(LocalDate.now().plusDays(14));
		Borrow saved = borrowRepo.save(b);

		// Increment borrow count on the resource (for popularity ranking)
		if (resource.isPresent()) {
			Resource r = resource.get();
			r.setBorrowCount(r.getBorrowCount() + 1);
			resourceRepo.save(r);
		}

		br.setStatus(Status.APPROVED);
		br.setDecisionBy(AuthContext.get().getEmail());
		br.setDecisionAt(Instant.now());
		br.setDecisionNotes(decisionNotes == null ? "" : decisionNotes);
		br.setLinkedBorrowId(saved.getId());
		return requestRepo.save(br);
	}

	/** Librarian or Admin rejects a pending (or legacy AWAITING_ADMIN) request. */
	public BookRequest reject(Long id, String decisionNotes) {
		RoleGuard.requireAnyRole("Librarian", "Admin");
		BookRequest br = requestRepo.findById(id)
				.orElseThrow(() -> new NotFoundException("Request not found: " + id));

		if (br.getStatus() != Status.PENDING && br.getStatus() != Status.AWAITING_ADMIN) {
			throw new IllegalArgumentException("Cannot reject a " + br.getStatus() + " request.");
		}

		br.setStatus(Status.REJECTED);
		br.setDecisionBy(AuthContext.get().getEmail());
		br.setDecisionAt(Instant.now());
		br.setDecisionNotes(decisionNotes == null ? "" : decisionNotes);
		return requestRepo.save(br);
	}
}
