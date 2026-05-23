package mth.models;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * A student's request to borrow a resource.
 *
 * Lifecycle (simplified — single-step):
 *   PENDING   → student created it, waiting for a librarian
 *   APPROVED  → a librarian said yes; a Borrow row is auto-created (linkedBorrowId)
 *   REJECTED  → a librarian said no; decisionNotes explains why
 *   CANCELLED → the student withdrew it before any decision
 *
 * decisionBy/decisionAt/decisionNotes form the audit trail Admin sees.
 */
@Entity
@Table(name = "book_requests", indexes = {
	@Index(name = "idx_requests_status", columnList = "status"),
	@Index(name = "idx_requests_student", columnList = "studentEmail")
})
public class BookRequest {

	public enum Status {
		PENDING,           // student created it, waiting for librarian
		AWAITING_ADMIN,    // legacy — rows from before the single-step change; converted to PENDING on startup
		APPROVED,          // librarian approved; Borrow row was auto-created
		REJECTED,          // librarian said no
		CANCELLED          // student withdrew it
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long resourceId;

	private String resourceTitle;       // snapshot for resilience to resource deletes

	@Column(nullable = false)
	private String studentEmail;

	private String studentName;

	@Column(length = 500)
	private String notes;               // optional reason from student

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private Status status = Status.PENDING;

	private String decisionBy;          // librarian email
	private Instant decisionAt;

	@Column(length = 500)
	private String decisionNotes;       // librarian's reason for approve/reject

	private Long linkedBorrowId;        // populated when approved → Borrow created

	@CreationTimestamp
	@Column(updatable = false)
	private Instant createdAt;

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }

	public Long getResourceId() { return resourceId; }
	public void setResourceId(Long resourceId) { this.resourceId = resourceId; }

	public String getResourceTitle() { return resourceTitle; }
	public void setResourceTitle(String resourceTitle) { this.resourceTitle = resourceTitle; }

	public String getStudentEmail() { return studentEmail; }
	public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

	public String getStudentName() { return studentName; }
	public void setStudentName(String studentName) { this.studentName = studentName; }

	public String getNotes() { return notes; }
	public void setNotes(String notes) { this.notes = notes; }

	public Status getStatus() { return status; }
	public void setStatus(Status status) { this.status = status; }

	public String getDecisionBy() { return decisionBy; }
	public void setDecisionBy(String decisionBy) { this.decisionBy = decisionBy; }

	public Instant getDecisionAt() { return decisionAt; }
	public void setDecisionAt(Instant decisionAt) { this.decisionAt = decisionAt; }

	public String getDecisionNotes() { return decisionNotes; }
	public void setDecisionNotes(String decisionNotes) { this.decisionNotes = decisionNotes; }

	public Long getLinkedBorrowId() { return linkedBorrowId; }
	public void setLinkedBorrowId(Long linkedBorrowId) { this.linkedBorrowId = linkedBorrowId; }

	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
