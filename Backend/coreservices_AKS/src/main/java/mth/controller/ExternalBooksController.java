package mth.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import mth.models.BookRequest;
import mth.models.Resource;
import mth.services.ArxivService;
import mth.services.OpenLibraryService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/external")
public class ExternalBooksController {

	@Autowired private OpenLibraryService openLib;
	@Autowired private ArxivService      arxiv;

	// ── Open Library (books) ────────────────────────────────

	/** GET /external/books?q=mockingbird&limit=10 */
	@GetMapping("/books")
	public List<Map<String, Object>> searchBooks(
			@RequestParam("q") String query,
			@RequestParam(value = "limit", defaultValue = "10") int limit) throws Exception {
		return openLib.search(query, limit);
	}

	/** POST /external/books/import — body picks one search hit + target sectionId. */
	@PostMapping("/books/import")
	public Resource importBook(@RequestBody Map<String, Object> body) {
		return openLib.importBook(body);
	}

	/**
	 * POST /external/books/request — student-driven flow.
	 * Imports the book as unpublished (or reuses an existing one) and
	 * creates a PENDING BookRequest for the current student.
	 * Librarian's normal approval will create the Borrow.
	 */
	@PostMapping("/books/request")
	public BookRequest requestBook(@RequestBody Map<String, Object> body) {
		return openLib.requestImport(body);
	}

	// ── arXiv (papers — physics, math, CS, biology, finance) ──

	/**
	 * GET /external/arxiv?q=quantum+computing&limit=10
	 * Searches the arXiv API and returns papers with title, abstract, authors, categories.
	 */
	@GetMapping("/arxiv")
	public List<Map<String, Object>> searchArxiv(
			@RequestParam("q") String query,
			@RequestParam(value = "limit", defaultValue = "10") int limit) throws Exception {
		return arxiv.search(query, limit);
	}

	/**
	 * POST /external/arxiv/import
	 * Imports one arXiv paper as a local Resource.
	 * Body: { sectionId, title, summary?, author?, year?, categories?[], arxivId? }
	 */
	@PostMapping("/arxiv/import")
	public Resource importArxiv(@RequestBody Map<String, Object> body) {
		return arxiv.importPaper(body);
	}

	/** POST /external/arxiv/request — student-driven flow (see /books/request). */
	@PostMapping("/arxiv/request")
	public BookRequest requestArxiv(@RequestBody Map<String, Object> body) {
		return arxiv.requestImport(body);
	}
}
