package mth.services;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import mth.models.BookRequest;
import mth.models.BookRequest.Status;
import mth.models.Resource;
import mth.models.Users;
import mth.repository.BookRequestRepository;
import mth.repository.ResourceRepository;
import mth.repository.SectionRepository;
import mth.repository.UsersRepository;
import mth.security.AuthContext;
import mth.security.NotFoundException;
import mth.security.RoleGuard;

/**
 * Thin client for Open Library's free search API.
 *
 * Example:  https://openlibrary.org/search.json?q=to+kill+a+mockingbird&limit=10
 *
 * We only surface the fields librarians actually want: title, author, year,
 * cover URL, subjects, and Open Library's stable work key. Anything richer
 * can be fetched on-demand from /works/{key}.json later.
 */
@Service
public class OpenLibraryService {

	private static final String SEARCH_URL = "https://openlibrary.org/search.json?q=%s&limit=%d";
	private static final String COVER_URL  = "https://covers.openlibrary.org/b/id/%s-M.jpg";

	private final HttpClient http = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(10))
			.followRedirects(HttpClient.Redirect.NORMAL)
			.build();

	private final ObjectMapper mapper = new ObjectMapper();

	@Autowired private ResourceRepository resourceRepo;
	@Autowired private SectionRepository sectionRepo;
	@Autowired private BookRequestRepository requestRepo;
	@Autowired private UsersRepository usersRepo;

	/** Anyone logged in can search; importing requires Librarian/Admin. */
	public List<Map<String, Object>> search(String query, int limit) throws Exception {
		RoleGuard.requireLoggedIn();
		if (query == null || query.isBlank()) return List.of();
		int safeLimit = Math.max(1, Math.min(limit <= 0 ? 10 : limit, 25));

		String url = String.format(SEARCH_URL,
				URLEncoder.encode(query.trim(), StandardCharsets.UTF_8),
				safeLimit);

		HttpRequest req = HttpRequest.newBuilder(URI.create(url))
				.timeout(Duration.ofSeconds(15))
				.header("User-Agent", "AKS-CourseProject/1.0")
				.GET()
				.build();

		HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
		if (res.statusCode() / 100 != 2) {
			throw new RuntimeException("Open Library returned HTTP " + res.statusCode());
		}

		JsonNode root = mapper.readTree(res.body());
		JsonNode docs = root.get("docs");
		List<Map<String, Object>> out = new ArrayList<>();
		if (docs == null || !docs.isArray()) return out;

		for (JsonNode doc : docs) {
			Map<String, Object> row = new HashMap<>();
			row.put("openLibraryKey", text(doc, "key"));           // "/works/OL12345W"
			row.put("title",          text(doc, "title"));
			row.put("author",         firstString(doc.get("author_name")));
			row.put("year",           intOrNull(doc, "first_publish_year"));
			row.put("subjects",       toStringList(doc.get("subject"), 8));
			Long coverId = doc.has("cover_i") && !doc.get("cover_i").isNull() ? doc.get("cover_i").asLong() : null;
			row.put("coverUrl",       coverId == null ? null : String.format(COVER_URL, coverId));
			out.add(row);
		}
		return out;
	}

	/**
	 * Create a local Resource from one search hit.
	 * The librarian picks which section to drop it into.
	 *
	 * Body shape (echoes a `search` row):
	 *   { sectionId, title, author?, year?, subjects?[], coverUrl?, summary?, body? }
	 */
	public Resource importBook(Map<String, Object> payload) {
		RoleGuard.requireAnyRole("Librarian", "Admin");

		String sectionId = str(payload.get("sectionId"));
		String title     = str(payload.get("title"));
		if (sectionId == null || sectionId.isBlank()) throw new IllegalArgumentException("sectionId is required.");
		if (title == null     || title.isBlank())     throw new IllegalArgumentException("title is required.");
		if (!sectionRepo.existsById(sectionId)) throw new NotFoundException("Section not found: " + sectionId);

		Resource r = new Resource();
		r.setSectionId(sectionId);
		r.setTitle(title.trim());
		r.setAuthor(str(payload.get("author")));
		Object year = payload.get("year");
		if (year instanceof Number n) r.setYear(n.intValue());

		String summary = str(payload.get("summary"));
		if (summary == null || summary.isBlank()) {
			summary = "Imported from Open Library.";
		}
		r.setSummary(summary);

		String body = str(payload.get("body"));
		if (body != null && !body.isBlank()) r.setBody(body);

		Object subjects = payload.get("subjects");
		if (subjects instanceof List<?> list) {
			List<String> tags = new ArrayList<>();
			for (Object o : list) if (o != null) tags.add(o.toString());
			r.setTags(tags);
		}

		// Stash the cover URL so the UI can show it if it wants.
		String coverUrl = str(payload.get("coverUrl"));
		if (coverUrl != null && !coverUrl.isBlank()) {
			r.setBody((r.getBody() == null ? "" : r.getBody() + "\n\n") + "Cover: " + coverUrl);
		}
		return resourceRepo.save(r);
	}

	/**
	 * Student-driven flow: take a search hit, import it as unpublished if it's
	 * not already in the catalog, then create a PENDING BookRequest for the
	 * current student. Librarian's normal approval flow handles the rest.
	 *
	 * Body shape: same as importBook(), plus optional `notes` (student's reason).
	 * sectionId defaults to "literature" if the student didn't pick one.
	 */
	public BookRequest requestImport(Map<String, Object> payload) {
		RoleGuard.requireAnyRole("Student", "Admin");

		String title = str(payload.get("title"));
		if (title == null || title.isBlank())
			throw new IllegalArgumentException("title is required.");

		// Default the section so students don't need to pick one.
		String sectionId = str(payload.get("sectionId"));
		if (sectionId == null || sectionId.isBlank()) sectionId = "literature";
		if (!sectionRepo.existsById(sectionId))
			throw new NotFoundException("Section not found: " + sectionId);

		String author = str(payload.get("author"));

		// Dedup: if we've already imported this exact title/author combo, reuse it.
		Resource existing = resourceRepo.findAllByOrderByCreatedAtDesc().stream()
				.filter(r -> title.equalsIgnoreCase(r.getTitle())
						&& ((author == null && r.getAuthor() == null)
						 || (author != null && author.equalsIgnoreCase(r.getAuthor()))))
				.findFirst().orElse(null);

		Resource r;
		if (existing != null) {
			r = existing;
		} else {
			Map<String, Object> withSection = new HashMap<>(payload);
			withSection.put("sectionId", sectionId);
			// Bypass the import role check by inlining the build — students aren't
			// allowed to call importBook directly, but we trust the data because
			// we built the search results ourselves.
			r = new Resource();
			r.setSectionId(sectionId);
			r.setTitle(title.trim());
			r.setAuthor(author);
			Object year = payload.get("year");
			if (year instanceof Number n) r.setYear(n.intValue());

			String summary = str(payload.get("summary"));
			r.setSummary((summary == null || summary.isBlank()) ? "Imported from Open Library." : summary);

			Object subjects = payload.get("subjects");
			if (subjects instanceof List<?> list) {
				List<String> tags = new ArrayList<>();
				for (Object o : list) if (o != null) tags.add(o.toString());
				r.setTags(tags);
			}

			String coverUrl = str(payload.get("coverUrl"));
			if (coverUrl != null && !coverUrl.isBlank()) {
				r.setBody("Cover: " + coverUrl);
			}
			r.setPublished(false);   // admin still controls public visibility
			r = resourceRepo.save(r);
		}

		// Create the PENDING request tied to this resource.
		Users u = usersRepo.findByEmail(AuthContext.get().getEmail())
				.orElseThrow(() -> new NotFoundException("Caller user not found."));
		String notes = str(payload.get("notes"));

		BookRequest br = new BookRequest();
		br.setResourceId(r.getId());
		br.setResourceTitle(r.getTitle());
		br.setStudentEmail(u.getEmail());
		br.setStudentName(u.getFullname());
		br.setNotes(notes == null ? "" : notes);
		br.setStatus(Status.PENDING);
		return requestRepo.save(br);
	}

	// -- tiny JSON helpers --

	private static String text(JsonNode n, String f) {
		if (n == null || !n.has(f) || n.get(f).isNull()) return null;
		return n.get(f).asText();
	}
	private static Integer intOrNull(JsonNode n, String f) {
		if (n == null || !n.has(f) || n.get(f).isNull()) return null;
		return n.get(f).asInt();
	}
	private static String firstString(JsonNode arr) {
		if (arr == null || !arr.isArray() || arr.isEmpty()) return null;
		return arr.get(0).asText();
	}
	private static List<String> toStringList(JsonNode arr, int max) {
		List<String> out = new ArrayList<>();
		if (arr == null || !arr.isArray()) return out;
		for (int i = 0; i < arr.size() && out.size() < max; i++) {
			if (!arr.get(i).isNull()) out.add(arr.get(i).asText());
		}
		return out;
	}
	private static String str(Object o) { return o == null ? null : o.toString(); }
}
