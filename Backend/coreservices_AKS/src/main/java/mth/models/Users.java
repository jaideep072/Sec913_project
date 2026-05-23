package mth.models;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A registered user of the Knowledge Portal.
 *
 * Role is one of: "Student", "Librarian", "Staff".
 * Status is 1 = active, 0 = disabled.
 */
@Entity
@Table(name = "users")
public class Users {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String fullname;

	private String phone;

	@Column(unique = true, nullable = false)
	private String email;

	private String password;

	/** Student | Librarian | Staff */
	@Column(nullable = false)
	private String role;

	/** 1 = active, 0 = disabled */
	private int status;

	@CreationTimestamp
	@Column(updatable = false)
	private Instant createdAt;

	// -- getters / setters --

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }

	public String getFullname() { return fullname; }
	public void setFullname(String fullname) { this.fullname = fullname; }

	public String getPhone() { return phone; }
	public void setPhone(String phone) { this.phone = phone; }

	public String getEmail() { return email; }
	public void setEmail(String email) { this.email = email; }

	public String getPassword() { return password; }
	public void setPassword(String password) { this.password = password; }

	public String getRole() { return role; }
	public void setRole(String role) { this.role = role; }

	public int getStatus() { return status; }
	public void setStatus(int status) { this.status = status; }

	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
