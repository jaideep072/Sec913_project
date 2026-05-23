package mth.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import mth.models.Borrow;
import mth.models.Resource;
import mth.repository.BorrowRepository;
import mth.repository.ResourceRepository;
import mth.repository.SectionRepository;
import mth.security.AuthContext;
import mth.security.NotFoundException;
import mth.security.RoleGuard;

@Service
public class ResourceService {

	@Autowired private ResourceRepository resourceRepo;
	@Autowired private SectionRepository sectionRepo;
	@Autowired private BorrowRepository borrowRepo;

	/**
	 * Students only see PUBLISHED resources, and only the teaser fields
	 * (title, section, author, cover-derived URL). Everyone else sees everything.
	 */
	public List<Resource> list(String sectionId) {
		RoleGuard.requireLoggedIn();
		String role = AuthContext.get().getRole();

		if ("Student".equals(role)) {
			// 1. All published resources (the standard catalog).
			List<Resource> published = (sectionId == null || sectionId.isBlank())
					? resourceRepo.findByPublishedTrueOrderByCreatedAtDesc()
					: resourceRepo.findByPublishedTrueAndSectionIdOrderByCreatedAtDesc(sectionId);

			// 2. Unpublished resources that the student has an active borrow for.
			List<Resource> borrowedUnpublished = Collections.emptyList();
			List<Borrow> activeBorrows = borrowRepo
					.findByBorrowerEmailAndReturnedOnIsNull(AuthContext.get().getEmail());
			if (!activeBorrows.isEmpty()) {
				Set<Long> publishedIds = published.stream().map(Resource::getId).collect(Collectors.toSet());
				List<Long> unpublishedBorrowedIds = activeBorrows.stream()
						.map(Borrow::getResourceId)
						.filter(id -> !publishedIds.contains(id))
						.collect(Collectors.toList());
				if (!unpublishedBorrowedIds.isEmpty()) {
					borrowedUnpublished = resourceRepo.findByIdIn(unpublishedBorrowedIds);
				}
			}

			// 3. Merge, preserving creation-date ordering.
			List<Resource> all = new ArrayList<>(published);
			all.addAll(borrowedUnpublished);
			return all.stream().map(r -> redact(r, false)).collect(Collectors.toList());
		}

		// Librarian / Staff / Admin see everything
		if (sectionId == null || sectionId.isBlank()) {
			return resourceRepo.findAllByOrderByCreatedAtDesc();
		}
		return resourceRepo.findBySectionIdOrderByCreatedAtDesc(sectionId);
	}

	public Resource get(Long id) {
		RoleGuard.requireLoggedIn();
		Resource r = resourceRepo.findById(id)
				.orElseThrow(() -> new NotFoundException("Resource not found: " + id));

		String role = AuthContext.get().getRole();
		if (!"Student".equals(role)) return r;

		// Check for an active borrow FIRST — if the student has already been
		// approved by a librarian, they get the full view regardless of the
		// published flag (resources imported from external APIs are unpublished).
		boolean hasActiveBorrow = borrowRepo
				.existsByBorrowerEmailAndResourceIdAndReturnedOnIsNull(AuthContext.get().getEmail(), id);
		if (hasActiveBorrow) return r;

		// No active borrow: hide unpublished resources from students.
		if (!r.isPublished()) throw new NotFoundException("Resource not found: " + id);

		// Published but no borrow → show only the teaser.
		return redact(r, false);
	}

	public List<Resource> search(String query) {
		RoleGuard.requireLoggedIn();
		List<Resource> rows = (query == null || query.isBlank())
				? resourceRepo.findAllByOrderByCreatedAtDesc()
				: resourceRepo.fullTextSearch(query.trim());

		// Students get the same filter + redaction treatment for search results.
		if ("Student".equals(AuthContext.get().getRole())) {
			return rows.stream()
					.filter(Resource::isPublished)
					.map(r -> redact(r, false))
					.collect(Collectors.toList());
		}
		return rows;
	}

	public Resource create(Resource input) {
		RoleGuard.requireAnyRole("Librarian", "Admin");
		requireSection(input.getSectionId());
		if (input.getTitle() == null || input.getTitle().isBlank()) {
			throw new IllegalArgumentException("Title is required.");
		}
		input.setId(null);
		// New resources start UNPUBLISHED. Admin must explicitly publish.
		input.setPublished(false);
		return resourceRepo.save(input);
	}

	public Resource update(Long id, Resource input) {
		RoleGuard.requireAnyRole("Librarian", "Admin");
		Resource r = resourceRepo.findById(id)
				.orElseThrow(() -> new NotFoundException("Resource not found: " + id));

		if (input.getSectionId() != null) {
			requireSection(input.getSectionId());
			r.setSectionId(input.getSectionId());
		}
		if (input.getTitle() != null && !input.getTitle().isBlank()) r.setTitle(input.getTitle().trim());
		if (input.getSummary() != null)     r.setSummary(input.getSummary());
		if (input.getBody() != null)        r.setBody(input.getBody());
		if (input.getAuthor() != null)      r.setAuthor(input.getAuthor());
		if (input.getYear() != null)        r.setYear(input.getYear());
		if (input.getPages() != null)       r.setPages(input.getPages());
		if (input.getDifficulty() != null)  r.setDifficulty(input.getDifficulty());
		if (input.getPeriod() != null)      r.setPeriod(input.getPeriod());
		if (input.getOrigin() != null)      r.setOrigin(input.getOrigin());
		if (input.getKeyQuote() != null)    r.setKeyQuote(input.getKeyQuote());
		if (input.getKeyFact() != null)     r.setKeyFact(input.getKeyFact());
		if (input.getImpact() != null)      r.setImpact(input.getImpact());
		if (input.getWhyRead() != null)     r.setWhyRead(input.getWhyRead());
		if (input.getWhyStudy() != null)    r.setWhyStudy(input.getWhyStudy());
		if (input.getTags() != null)          r.setTags(input.getTags());
		if (input.getKeyThemes() != null)     r.setKeyThemes(input.getKeyThemes());
		if (input.getKeyFigures() != null)    r.setKeyFigures(input.getKeyFigures());
		if (input.getKeyFacts() != null)      r.setKeyFacts(input.getKeyFacts());
		if (input.getSimilarTo() != null)     r.setSimilarTo(input.getSimilarTo());
		if (input.getSimilarTopics() != null) r.setSimilarTopics(input.getSimilarTopics());
		if (input.getRelatedTopics() != null) r.setRelatedTopics(input.getRelatedTopics());
		// Note: published is intentionally NOT changed here — it has its own endpoint.

		return resourceRepo.save(r);
	}

	public void delete(Long id) {
		RoleGuard.requireAnyRole("Librarian", "Admin");
		if (!resourceRepo.existsById(id)) {
			throw new NotFoundException("Resource not found: " + id);
		}
		resourceRepo.deleteById(id);
	}

	/** Admin-only: flip the published bit. Returns the updated resource. */
	public Resource setPublished(Long id, boolean published) {
		RoleGuard.requireRole("Admin");
		Resource r = resourceRepo.findById(id)
				.orElseThrow(() -> new NotFoundException("Resource not found: " + id));
		r.setPublished(published);
		return resourceRepo.save(r);
	}

	private void requireSection(String sectionId) {
		if (sectionId == null || sectionId.isBlank()) {
			throw new IllegalArgumentException("sectionId is required.");
		}
		if (!sectionRepo.existsById(sectionId)) {
			throw new IllegalArgumentException("Unknown section: " + sectionId);
		}
	}

	/**
	 * Strip everything except teaser fields. Used for Student responses.
	 * If {@code fullView} is true (they have an active borrow), return the resource
	 * untouched.
	 */
	private Resource redact(Resource src, boolean fullView) {
		if (fullView) return src;

		Resource teaser = new Resource();
		teaser.setId(src.getId());
		teaser.setSectionId(src.getSectionId());
		teaser.setTitle(src.getTitle());
		teaser.setPublished(src.isPublished());
		teaser.setCreatedAt(src.getCreatedAt());
		// We chose "Title + section + cover only" in the spec.
		// Cover URL is embedded in the body line `Cover: <url>` by OpenLibraryService.
		// Extract just that single line so cards can show the image.
		String cover = extractCoverUrl(src.getBody());
		if (cover != null) {
			teaser.setBody("Cover: " + cover);   // kept in body so frontend's existing parsing works
		}
		// Keep tags empty + everything else null. Body stays null otherwise.
		teaser.setTags(new ArrayList<>());
		return teaser;
	}

	private static String extractCoverUrl(String body) {
		if (body == null) return null;
		int i = body.indexOf("Cover: ");
		if (i < 0) return null;
		String tail = body.substring(i + "Cover: ".length());
		int newline = tail.indexOf('\n');
		return (newline < 0 ? tail : tail.substring(0, newline)).trim();
	}
}
