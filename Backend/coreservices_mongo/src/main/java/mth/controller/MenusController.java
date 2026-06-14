package mth.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import mth.models.Menus;
import mth.repository.MenusRepository;

@RestController
@RequestMapping("/menus")
@CrossOrigin(origins = "*")
public class MenusController {

	@Autowired
	MenusRepository repo;

	@GetMapping
	public List<Menus> getMenus() {
		return repo.findAll();
	}

	@PostMapping
	public Object addMenu(@RequestBody Menus menu) {
		Map<String, Object> response = new HashMap<>();
		try {
			if (menu.getMenu() == null || menu.getMenu().trim().isEmpty()) {
				response.put("code", 400);
				response.put("message", "Menu name is required");
				return response;
			}

			// Auto-assign next menu id (PK is not auto-generated on the entity)
			if (menu.getMid() == null) {
				Long nextId = repo.getMaxMenuId() + 1;
				menu.setMid(nextId);
			}

			// default icon if none provided
			if (menu.getIcon() == null || menu.getIcon().trim().isEmpty()) {
				menu.setIcon("menu.png");
			}

			repo.save(menu);
			response.put("code", 200);
			response.put("message", "Menu added successfully");
			response.put("menu", menu);
		} catch (Exception e) {
			response.put("code", 500);
			response.put("message", e.getMessage());
		}
		return response;
	}
}
