package mth.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import mth.models.Resource;
import mth.services.ResourceService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/resources")
public class ResourceController {

	@Autowired private ResourceService svc;

	/** Optional ?sectionId=literature filter. */
	@GetMapping
	public List<Resource> list(@RequestParam(value = "sectionId", required = false) String sectionId) {
		return svc.list(sectionId);
	}

	/** Full-text search: /resources/search?q=... */
	@GetMapping("/search")
	public List<Resource> search(@RequestParam("q") String query) {
		return svc.search(query);
	}

	@GetMapping("/{id}")
	public Resource get(@PathVariable Long id) {
		return svc.get(id);
	}

	@PostMapping
	public Resource create(@RequestBody Resource body) {
		return svc.create(body);
	}

	@PutMapping("/{id}")
	public Resource update(@PathVariable Long id, @RequestBody Resource body) {
		return svc.update(id, body);
	}

	@DeleteMapping("/{id}")
	public java.util.Map<String, Object> delete(@PathVariable Long id) {
		svc.delete(id);
		return java.util.Map.of("code", 200, "message", "Resource deleted.");
	}

	/** Admin-only: publish/unpublish. Body: { "published": true } */
	@PutMapping("/{id}/publish")
	public Resource setPublished(@PathVariable Long id,
			@RequestBody java.util.Map<String, Object> body) {
		boolean p = body.get("published") != null && Boolean.parseBoolean(body.get("published").toString());
		return svc.setPublished(id, p);
	}
}
