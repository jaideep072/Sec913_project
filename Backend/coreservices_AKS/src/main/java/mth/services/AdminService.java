package mth.services;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import mth.models.BookRequest;
import mth.models.Borrow;
import mth.models.Users;
import mth.repository.BookRequestRepository;
import mth.repository.BorrowRepository;
import mth.repository.UsersRepository;
import mth.security.NotFoundException;
import mth.security.RoleGuard;

/**
 * Admin-only operations. Everything in here requires role=Admin.
 *
 * Most of these are "god mode" — Admin can change other users' roles,
 * suspend accounts, force-delete records. The audit endpoint aggregates
 * data from existing tables so we don't need a separate audit-log table.
 */
@Service
public class AdminService {

	private static final Set<String> ALLOWED_ROLES = Set.of("Student", "Librarian", "Staff", "Admin");

	@Autowired private UsersRepository usersRepo;
	@Autowired private BorrowRepository borrowRepo;
	@Autowired private BookRequestRepository requestRepo;

	public List<Users> listUsers() {
		RoleGuard.requireRole("Admin");
		List<Users> users = usersRepo.findAll();
		users.forEach(u -> u.setPassword(null));   // never leak passwords back to the UI
		return users;
	}

	public Users setUserRole(Long userId, String newRole) {
		RoleGuard.requireRole("Admin");
		if (newRole == null || !ALLOWED_ROLES.contains(newRole)) {
			throw new IllegalArgumentException("Unknown role: " + newRole);
		}
		Users u = usersRepo.findById(userId)
				.orElseThrow(() -> new NotFoundException("User not found: " + userId));
		u.setRole(newRole);
		Users saved = usersRepo.save(u);
		saved.setPassword(null);
		return saved;
	}

	/** Toggle active/disabled. 1 = active, 0 = suspended. */
	public Users setUserStatus(Long userId, int status) {
		RoleGuard.requireRole("Admin");
		if (status != 0 && status != 1) throw new IllegalArgumentException("status must be 0 or 1");
		Users u = usersRepo.findById(userId)
				.orElseThrow(() -> new NotFoundException("User not found: " + userId));
		u.setStatus(status);
		Users saved = usersRepo.save(u);
		saved.setPassword(null);
		return saved;
	}

	public void deleteUser(Long userId) {
		RoleGuard.requireRole("Admin");
		Users u = usersRepo.findById(userId)
				.orElseThrow(() -> new NotFoundException("User not found: " + userId));
		// Block deleting the last admin to avoid locking yourself out.
		if ("Admin".equals(u.getRole())) {
			long admins = usersRepo.findAll().stream()
					.filter(x -> "Admin".equals(x.getRole())).count();
			if (admins <= 1) {
				throw new IllegalArgumentException("Cannot delete the last remaining admin.");
			}
		}
		usersRepo.delete(u);
	}

	/**
	 * Aggregated audit view: every approved/rejected request and every borrow,
	 * tagged with who acted. The frontend renders this as a single timeline.
	 */
	public Map<String, Object> audit() {
		RoleGuard.requireRole("Admin");

		Map<String, Object> out = new HashMap<>();

		// Headline counts
		Map<String, Object> stats = new HashMap<>();
		stats.put("users", usersRepo.count());
		stats.put("borrows", borrowRepo.count());
		stats.put("requests", requestRepo.count());
		stats.put("pendingRequests",
				requestRepo.findByStatusOrderByCreatedAtDesc(BookRequest.Status.PENDING).size());
		out.put("stats", stats);

		// "Who approved what" — decisions made on requests
		List<Map<String, Object>> decisions = new ArrayList<>();
		for (BookRequest br : requestRepo.findAllByOrderByCreatedAtDesc()) {
			if (br.getDecisionAt() == null) continue;
			Map<String, Object> row = new HashMap<>();
			row.put("at", br.getDecisionAt());
			row.put("librarianEmail", br.getDecisionBy());
			row.put("studentEmail", br.getStudentEmail());
			row.put("studentName", br.getStudentName());
			row.put("bookTitle", br.getResourceTitle());
			row.put("decision", br.getStatus().name());
			row.put("notes", br.getDecisionNotes());
			row.put("requestId", br.getId());
			row.put("linkedBorrowId", br.getLinkedBorrowId());
			decisions.add(row);
		}
		out.put("decisions", decisions);

		// Currently active borrows (overdue + active) — useful for "what's out right now"
		List<Map<String, Object>> activeBorrows = new ArrayList<>();
		for (Borrow b : borrowRepo.findAllByOrderByBorrowedOnDesc()) {
			if (b.getReturnedOn() != null) continue;
			Map<String, Object> row = new HashMap<>();
			row.put("id", b.getId());
			row.put("bookTitle", b.getBookTitle());
			row.put("borrowerName", b.getBorrowerName());
			row.put("borrowerEmail", b.getBorrowerEmail());
			row.put("dueDate", b.getDueDate());
			row.put("borrowedOn", b.getBorrowedOn());
			activeBorrows.add(row);
		}
		out.put("activeBorrows", activeBorrows);

		return out;
	}
}
