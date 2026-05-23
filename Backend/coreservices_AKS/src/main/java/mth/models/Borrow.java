package mth.models;

import java.time.Instant;
import java.time.LocalDate;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

/**
 * A check-out record managed by Staff.
 *
 * We snapshot the book + borrower fields (title, author, section, borrower name/email)
 * so the row remains readable even if the underlying resource or user gets renamed
 * or deleted later. Status is computed at read time from the dates.
 */
@Entity
@Table(name = "borrows", indexes = {
	@Index(name = "idx_borrows_status_due", columnList = "returnedOn, dueDate"),
	@Index(name = "idx_borrows_borrower", columnList = "borrowerEmail")
})
public class Borrow {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private Long resourceId;

	@Column(nullable = false)
	private String bookTitle;

	private String bookAuthor;

	private String section;

	@Column(nullable = false)
	private String borrowerName;

	@Column(nullable = false)
	private String borrowerEmail;

	private String borrowerRole;

	@Column(nullable = false)
	private LocalDate borrowedOn;

	@Column(nullable = false)
	private LocalDate dueDate;

	private LocalDate returnedOn;

	@CreationTimestamp
	@Column(updatable = false)
	private Instant createdAt;

	/** Derived field — populated by the service before serialization. Not persisted. */
	@jakarta.persistence.Transient
	private String status;

	// -- getters / setters --

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }

	public Long getResourceId() { return resourceId; }
	public void setResourceId(Long resourceId) { this.resourceId = resourceId; }

	public String getBookTitle() { return bookTitle; }
	public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }

	public String getBookAuthor() { return bookAuthor; }
	public void setBookAuthor(String bookAuthor) { this.bookAuthor = bookAuthor; }

	public String getSection() { return section; }
	public void setSection(String section) { this.section = section; }

	public String getBorrowerName() { return borrowerName; }
	public void setBorrowerName(String borrowerName) { this.borrowerName = borrowerName; }

	public String getBorrowerEmail() { return borrowerEmail; }
	public void setBorrowerEmail(String borrowerEmail) { this.borrowerEmail = borrowerEmail; }

	public String getBorrowerRole() { return borrowerRole; }
	public void setBorrowerRole(String borrowerRole) { this.borrowerRole = borrowerRole; }

	public LocalDate getBorrowedOn() { return borrowedOn; }
	public void setBorrowedOn(LocalDate borrowedOn) { this.borrowedOn = borrowedOn; }

	public LocalDate getDueDate() { return dueDate; }
	public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

	public LocalDate getReturnedOn() { return returnedOn; }
	public void setReturnedOn(LocalDate returnedOn) { this.returnedOn = returnedOn; }

	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
}
