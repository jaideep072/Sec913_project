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
import org.springframework.web.bind.annotation.RestController;

import mth.models.Section;
import mth.services.SectionService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/sections")
public class SectionController {

	@Autowired private SectionService svc;

	@GetMapping
	public List<Section> list() {
		return svc.list();
	}

	@PostMapping
	public Section create(@RequestBody Section body) {
		return svc.create(body);
	}

	@PutMapping("/{id}")
	public Section update(@PathVariable String id, @RequestBody Section body) {
		return svc.update(id, body);
	}

	@DeleteMapping("/{id}")
	public java.util.Map<String, Object> delete(@PathVariable String id) {
		svc.delete(id);
		return java.util.Map.of("code", 200, "message", "Section deleted.");
	}
}
