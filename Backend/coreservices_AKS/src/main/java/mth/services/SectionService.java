package mth.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import mth.models.Section;
import mth.repository.ResourceRepository;
import mth.repository.SectionRepository;
import mth.security.NotFoundException;
import mth.security.RoleGuard;

@Service
public class SectionService {

	@Autowired private SectionRepository sectionRepo;
	@Autowired private ResourceRepository resourceRepo;

	/** Anyone logged in can list sections. */
	public List<Section> list() {
		RoleGuard.requireLoggedIn();
		return sectionRepo.findAll();
	}

	/** Librarian-only: create a new section. */
	public Section create(Section input) {
		RoleGuard.requireAnyRole("Librarian", "Admin");

		String name = required(input.getName(), "name");
		String slug = slugify(name);
		if (sectionRepo.existsById(slug)) {
			throw new IllegalArgumentException("A section named '" + name + "' already exists.");
		}
		Section s = new Section();
		s.setId(slug);
		s.setName(name.trim());
		s.setDescription(input.getDescription() == null ? "" : input.getDescription().trim());
		s.setCore(false);
		return sectionRepo.save(s);
	}

	/** Librarian-only: rename / re-describe an existing section. */
	public Section update(String id, Section input) {
		RoleGuard.requireAnyRole("Librarian", "Admin");
		Section s = sectionRepo.findById(id)
				.orElseThrow(() -> new NotFoundException("Section not found: " + id));
		if (input.getName() != null && !input.getName().isBlank()) s.setName(input.getName().trim());
		if (input.getDescription() != null) s.setDescription(input.getDescription().trim());
		return sectionRepo.save(s);
	}

	/** Librarian-only: delete a non-core section AND all its resources. */
	public void delete(String id) {
		RoleGuard.requireAnyRole("Librarian", "Admin");
		Section s = sectionRepo.findById(id)
				.orElseThrow(() -> new NotFoundException("Section not found: " + id));
		if (s.isCore()) {
			throw new IllegalArgumentException("Core sections cannot be deleted.");
		}
		resourceRepo.deleteBySectionId(id);
		sectionRepo.delete(s);
	}

	private static String required(String v, String field) {
		if (v == null || v.isBlank())
			throw new IllegalArgumentException(field + " is required.");
		return v;
	}

	/** "Greek Philosophy" → "greek-philosophy". Stable, URL-safe. */
	private static String slugify(String name) {
		return name.trim().toLowerCase()
				.replaceAll("[^a-z0-9]+", "-")
				.replaceAll("^-|-$", "");
	}
}
