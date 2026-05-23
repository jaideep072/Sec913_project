package mth.models;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A top-level category in the catalog: Literature, History, Science, Governance, etc.
 *
 * The id is a URL-friendly slug ("literature", "history") rather than a generated number
 * so it matches the frontend's string-based section ids without translation.
 *
 * {@code core} sections are seeded on first run and can't be deleted by librarians.
 */
@Entity
@Table(name = "sections")
public class Section {

	@Id
	@Column(length = 80)
	private String id;          // slug, e.g. "literature"

	@Column(nullable = false)
	private String name;        // display name

	@Column(length = 500)
	private String description;

	@Column(nullable = false)
	private boolean core;       // seeded section, not user-deletable

	@CreationTimestamp
	@Column(updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	private Instant updatedAt;

	public String getId() { return id; }
	public void setId(String id) { this.id = id; }

	public String getName() { return name; }
	public void setName(String name) { this.name = name; }

	public String getDescription() { return description; }
	public void setDescription(String description) { this.description = description; }

	public boolean isCore() { return core; }
	public void setCore(boolean core) { this.core = core; }

	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

	public Instant getUpdatedAt() { return updatedAt; }
	public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
