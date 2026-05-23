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

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

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
 * Thin client for the arXiv e-print search API (free, no key required).
 *
 * arXiv API returns Atom XML. We parse the relevant fields into the same
 * shape as OpenLibrary search results so the frontend import UI doesn't
 * need to change.
 *
 * Example query:
 *   http://export.arxiv.org/api/query?search_query=all:quantum+computing&max_results=10&sortBy=relevance
 *
 * Rate limit: arXiv asks for no more than 1 request per 3 seconds.
 * We stay well under that in normal use.
 */
@Service
public class ArxivService {

	private static final String ARXIV_API = "https://export.arxiv.org/api/query?search_query=all:%s&max_results=%d&sortBy=relevance&sortOrder=descending";

	private final HttpClient http = HttpClient.newBuilder()
			.connectTimeout(Duration.ofSeconds(10))
			.followRedirects(HttpClient.Redirect.NORMAL)
			.build();

	@Autowired private ResourceRepository resourceRepo;
	@Autowired private SectionRepository sectionRepo;
	@Autowired private BookRequestRepository requestRepo;
	@Autowired private UsersRepository usersRepo;

	/** Anyone logged in can search. */
	public List<Map<String, Object>> search(String query, int limit) throws Exception {
		RoleGuard.requireLoggedIn();
		if (query == null || query.isBlank()) return List.of();
		int safeLimit = Math.max(1, Math.min(limit <= 0 ? 10 : limit, 50));

		String url = String.format(ARXIV_API,
				URLEncoder.encode(query.trim(), StandardCharsets.UTF_8),
				safeLimit);

		HttpRequest req = HttpRequest.newBuilder(URI.create(url))
				.timeout(Duration.ofSeconds(20))
				.header("User-Agent", "AKS-CourseProject/1.0 (mailto:reachsainikhil@gmail.com)")
				.GET()
				.build();

		HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
		if (res.statusCode() / 100 != 2) {
			throw new RuntimeException("arXiv API returned HTTP " + res.statusCode());
		}

		return parseAtomFeed(res.body());
	}

	/**
	 * Parse the Atom XML feed from arXiv into the same Map shape as
	 * OpenLibraryService.search() so the frontend can reuse the same
	 * import card layout.
	 */
	private List<Map<String, Object>> parseAtomFeed(String xml) throws Exception {
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		factory.setNamespaceAware(true);
		DocumentBuilder builder = factory.newDocumentBuilder();
		Document doc = builder.parse(new org.xml.sax.InputSource(new java.io.StringReader(xml)));

		NodeList entries = doc.getElementsByTagNameNS("*", "entry");
		List<Map<String, Object>> out = new ArrayList<>();

		for (int i = 0; i < entries.getLength(); i++) {
			Element entry = (Element) entries.item(i);
			Map<String, Object> row = new HashMap<>();

			// arXiv ID — e.g. "http://arxiv.org/abs/2303.08774v1"
			String arxivId = getText(entry, "id");
			// Strip version suffix and URL prefix for a clean ID
			if (arxivId != null) {
				arxivId = arxivId.replace("http://arxiv.org/abs/", "")
				                 .replaceAll("v\\d+$", "");
			}
			row.put("arxivId", arxivId);

			row.put("title",       tidy(getText(entry, "title")));
			row.put("summary",     tidy(getText(entry, "summary")));
			row.put("author",      getFirstAuthor(entry));
			row.put("year",        extractYear(getText(entry, "published")));
			row.put("categories",  getCategories(entry));
			row.put("pdfUrl",      getLink(entry, "related", "application/pdf"));
			row.put("absUrl",      getLink(entry, "alternate", "text/html"));

			// arXiv doesn't provide cover images, so no coverUrl field.
			// The frontend will show a generic "📄 Paper" placeholder.

			out.add(row);
		}
		return out;
	}

	/**
	 * Create a local Resource from one arXiv search hit.
	 *
	 * Body shape (mirrors the `search` row):
	 *   { sectionId, title, summary?, author?, year?, categories?[], arxivId? }
	 */
	public Resource importPaper(Map<String, Object> payload) {
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

		// Use the arXiv abstract as the summary (truncate to 500 chars for display)
		String summary = str(payload.get("summary"));
		if (summary != null && summary.length() > 500) {
			summary = summary.substring(0, 497) + "...";
		}
		if (summary == null || summary.isBlank()) {
			summary = "Imported from arXiv.";
		}
		r.setSummary(summary);

		// Full abstract goes into body
		String fullBody = str(payload.get("summary"));
		if (fullBody == null || fullBody.isBlank()) {
			fullBody = "Imported from arXiv.";
		}
		r.setBody(fullBody);

		// Stash the arXiv ID and PDF link in the body as a reference line
		String arxivId = str(payload.get("arxivId"));
		String absUrl  = str(payload.get("absUrl"));
		String pdfUrl  = str(payload.get("pdfUrl"));
		StringBuilder ref = new StringBuilder("\n\n---\narXiv: ");
		if (arxivId != null) ref.append(arxivId);
		if (absUrl  != null) ref.append("  ·  ").append(absUrl);
		if (pdfUrl  != null) ref.append("  ·  [PDF](").append(pdfUrl).append(")");
		r.setBody(r.getBody() + ref.toString());

		// Categories become tags
		Object cats = payload.get("categories");
		if (cats instanceof List<?> list) {
			List<String> tags = new ArrayList<>();
			for (Object o : list) if (o != null) tags.add(o.toString());
			if (!tags.isEmpty()) r.setTags(tags);
		}

		// Auto-generate some key themes from categories
		Object categories = payload.get("categories");
		if (categories instanceof List<?> list) {
			List<String> themes = new ArrayList<>();
			for (Object o : list) {
				if (o != null) {
					String cat = o.toString();
					themes.add(cat.replaceFirst("^[a-z]+\\.", "").replace("-", " "));
				}
			}
			if (!themes.isEmpty()) r.setKeyThemes(themes);
		}

		r.setDifficulty("Advanced");
		r.setPublished(false);
		return resourceRepo.save(r);
	}

	/**
	 * Student-driven flow: import the paper as unpublished (if not already there)
	 * and create a PENDING BookRequest for the current student.
	 *
	 * Body shape: same as importPaper(), plus optional `notes`.
	 * sectionId defaults to "science".
	 */
	public BookRequest requestImport(Map<String, Object> payload) {
		RoleGuard.requireAnyRole("Student", "Admin");

		String title = str(payload.get("title"));
		if (title == null || title.isBlank())
			throw new IllegalArgumentException("title is required.");

		String sectionId = str(payload.get("sectionId"));
		if (sectionId == null || sectionId.isBlank()) sectionId = "science";
		if (!sectionRepo.existsById(sectionId))
			throw new NotFoundException("Section not found: " + sectionId);

		String arxivId = str(payload.get("arxivId"));

		// Dedup: prefer matching by arXiv ID (embedded in body), else by title.
		Resource existing = resourceRepo.findAllByOrderByCreatedAtDesc().stream()
				.filter(r -> {
					if (arxivId != null && r.getBody() != null && r.getBody().contains("arXiv: " + arxivId))
						return true;
					return title.equalsIgnoreCase(r.getTitle());
				})
				.findFirst().orElse(null);

		Resource r;
		if (existing != null) {
			r = existing;
		} else {
			r = new Resource();
			r.setSectionId(sectionId);
			r.setTitle(title.trim());
			r.setAuthor(str(payload.get("author")));
			Object year = payload.get("year");
			if (year instanceof Number n) r.setYear(n.intValue());

			String fullAbstract = str(payload.get("summary"));
			String summary = fullAbstract;
			if (summary != null && summary.length() > 500) summary = summary.substring(0, 497) + "...";
			r.setSummary((summary == null || summary.isBlank()) ? "Imported from arXiv." : summary);
			r.setBody((fullAbstract == null || fullAbstract.isBlank()) ? "Imported from arXiv." : fullAbstract);

			StringBuilder ref = new StringBuilder("\n\n---\narXiv: ");
			if (arxivId != null) ref.append(arxivId);
			Object absUrl = payload.get("absUrl");
			Object pdfUrl = payload.get("pdfUrl");
			if (absUrl != null) ref.append("  ·  ").append(absUrl);
			if (pdfUrl != null) ref.append("  ·  [PDF](").append(pdfUrl).append(")");
			r.setBody(r.getBody() + ref.toString());

			Object cats = payload.get("categories");
			if (cats instanceof List<?> list) {
				List<String> tags = new ArrayList<>();
				for (Object o : list) if (o != null) tags.add(o.toString());
				if (!tags.isEmpty()) r.setTags(tags);
			}
			r.setDifficulty("Advanced");
			r.setPublished(false);
			r = resourceRepo.save(r);
		}

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

	// -- XML parsing helpers --

	private static String getText(Element parent, String tag) {
		NodeList list = parent.getElementsByTagNameNS("*", tag);
		if (list.getLength() == 0) return null;
		String text = list.item(0).getTextContent();
		return (text == null || text.isBlank()) ? null : text.trim();
	}

	private static String getFirstAuthor(Element entry) {
		NodeList authors = entry.getElementsByTagNameNS("*", "author");
		if (authors.getLength() == 0) return null;
		Element author = (Element) authors.item(0);
		return getText(author, "name");
	}

	@SuppressWarnings("unchecked")
	private static List<String> getCategories(Element entry) {
		NodeList cats = entry.getElementsByTagNameNS("*", "category");
		List<String> out = new ArrayList<>();
		for (int i = 0; i < cats.getLength(); i++) {
			String term = ((Element) cats.item(i)).getAttribute("term");
			if (term != null && !term.isBlank()) out.add(term);
		}
		return out;
	}

	private static String getLink(Element entry, String rel, String type) {
		NodeList links = entry.getElementsByTagNameNS("*", "link");
		for (int i = 0; i < links.getLength(); i++) {
			Element link = (Element) links.item(i);
			String r = link.getAttribute("rel");
			String t = link.getAttribute("type");
			if ((rel == null || rel.equals(r)) && (type == null || type.equals(t))) {
				return link.getAttribute("href");
			}
		}
		return null;
	}

	private static Integer extractYear(String published) {
		if (published == null) return null;
		try {
			return Integer.parseInt(published.substring(0, 4));
		} catch (Exception e) {
			return null;
		}
	}

	/** arXiv often wraps titles/abstracts in newlines. */
	private static String tidy(String s) {
		if (s == null) return null;
		return s.replaceAll("\\s+", " ").trim();
	}

	private static String str(Object o) { return o == null ? null : o.toString().trim(); }
}
