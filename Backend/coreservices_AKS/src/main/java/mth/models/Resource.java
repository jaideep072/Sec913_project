package mth.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import mth.util.StringListConverter;

/**
 * A library item shown in the student portal — books, topics, articles.
 *
 * The list-of-string fields (tags, keyThemes, keyFacts, keyFigures,
 * similarTo, similarTopics, relatedTopics) are stored as a JSON-encoded
 * text column each via {@link StringListConverter}, so the entity stays
 * flat and there are no chatty join tables.
 *
 * sectionId is a plain string (not a JPA relationship) on purpose: the
 * frontend uses string slugs and we don't want a cascading FK constraint
 * fighting Hibernate's auto-DDL during early development.
 */
@Entity
@Table(name = "resources", indexes = {
	@Index(name = "idx_resources_section", columnList = "section_id")
})
public class Resource {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "section_id", nullable = false, length = 80)
	private String sectionId;

	/**
	 * Visibility gate. New resources default to false (hidden from Students).
	 * Admin flips this to true once they've reviewed the resource.
	 * The DB-level default is `true` so any pre-existing rows from before this
	 * column was added stay visible — only newly-created rows start unpublished.
	 */
	@Column(nullable = false, columnDefinition = "boolean not null default true")
	private boolean published = false;

	@Column(nullable = false)
	private String title;

	@Column(length = 1000)
	private String summary;

	@Column(columnDefinition = "TEXT")
	private String body;

	private String author;
	private Integer year;
	private Integer pages;
	private String difficulty;     // Beginner / Intermediate / Advanced
	private String period;         // historical period
	private String origin;         // geographic / cultural origin

	@Column(length = 1000)
	private String keyQuote;

	@Column(length = 1000)
	private String keyFact;

	@Column(columnDefinition = "TEXT")
	private String impact;

	@Column(columnDefinition = "TEXT")
	private String whyRead;

	@Column(columnDefinition = "TEXT")
	private String whyStudy;

	@Convert(converter = StringListConverter.class)
	@Column(columnDefinition = "TEXT")
	private List<String> tags = new ArrayList<>();

	@Convert(converter = StringListConverter.class)
	@Column(columnDefinition = "TEXT")
	private List<String> keyThemes = new ArrayList<>();

	@Convert(converter = StringListConverter.class)
	@Column(columnDefinition = "TEXT")
	private List<String> keyFigures = new ArrayList<>();

	@Convert(converter = StringListConverter.class)
	@Column(columnDefinition = "TEXT")
	private List<String> keyFacts = new ArrayList<>();

	@Convert(converter = StringListConverter.class)
	@Column(columnDefinition = "TEXT")
	private List<String> similarTo = new ArrayList<>();

	@Convert(converter = StringListConverter.class)
	@Column(columnDefinition = "TEXT")
	private List<String> similarTopics = new ArrayList<>();

	@Convert(converter = StringListConverter.class)
	@Column(columnDefinition = "TEXT")
	private List<String> relatedTopics = new ArrayList<>();

	@CreationTimestamp
	@Column(updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	private Instant updatedAt;

	// -- getters / setters --

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }

	public String getSectionId() { return sectionId; }
	public void setSectionId(String sectionId) { this.sectionId = sectionId; }

	public boolean isPublished() { return published; }
	public void setPublished(boolean published) { this.published = published; }

	public String getTitle() { return title; }
	public void setTitle(String title) { this.title = title; }

	public String getSummary() { return summary; }
	public void setSummary(String summary) { this.summary = summary; }

	public String getBody() { return body; }
	public void setBody(String body) { this.body = body; }

	public String getAuthor() { return author; }
	public void setAuthor(String author) { this.author = author; }

	public Integer getYear() { return year; }
	public void setYear(Integer year) { this.year = year; }

	public Integer getPages() { return pages; }
	public void setPages(Integer pages) { this.pages = pages; }

	public String getDifficulty() { return difficulty; }
	public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

	public String getPeriod() { return period; }
	public void setPeriod(String period) { this.period = period; }

	public String getOrigin() { return origin; }
	public void setOrigin(String origin) { this.origin = origin; }

	public String getKeyQuote() { return keyQuote; }
	public void setKeyQuote(String keyQuote) { this.keyQuote = keyQuote; }

	public String getKeyFact() { return keyFact; }
	public void setKeyFact(String keyFact) { this.keyFact = keyFact; }

	public String getImpact() { return impact; }
	public void setImpact(String impact) { this.impact = impact; }

	public String getWhyRead() { return whyRead; }
	public void setWhyRead(String whyRead) { this.whyRead = whyRead; }

	public String getWhyStudy() { return whyStudy; }
	public void setWhyStudy(String whyStudy) { this.whyStudy = whyStudy; }

	public List<String> getTags() { return tags; }
	public void setTags(List<String> tags) { this.tags = tags == null ? new ArrayList<>() : tags; }

	public List<String> getKeyThemes() { return keyThemes; }
	public void setKeyThemes(List<String> keyThemes) { this.keyThemes = keyThemes == null ? new ArrayList<>() : keyThemes; }

	public List<String> getKeyFigures() { return keyFigures; }
	public void setKeyFigures(List<String> keyFigures) { this.keyFigures = keyFigures == null ? new ArrayList<>() : keyFigures; }

	public List<String> getKeyFacts() { return keyFacts; }
	public void setKeyFacts(List<String> keyFacts) { this.keyFacts = keyFacts == null ? new ArrayList<>() : keyFacts; }

	public List<String> getSimilarTo() { return similarTo; }
	public void setSimilarTo(List<String> similarTo) { this.similarTo = similarTo == null ? new ArrayList<>() : similarTo; }

	public List<String> getSimilarTopics() { return similarTopics; }
	public void setSimilarTopics(List<String> similarTopics) { this.similarTopics = similarTopics == null ? new ArrayList<>() : similarTopics; }

	public List<String> getRelatedTopics() { return relatedTopics; }
	public void setRelatedTopics(List<String> relatedTopics) { this.relatedTopics = relatedTopics == null ? new ArrayList<>() : relatedTopics; }

	public Instant getCreatedAt() { return createdAt; }
	public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

	public Instant getUpdatedAt() { return updatedAt; }
	public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
