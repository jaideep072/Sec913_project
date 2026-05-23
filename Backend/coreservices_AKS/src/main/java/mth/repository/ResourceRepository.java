package mth.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import mth.models.Resource;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

	List<Resource> findBySectionIdOrderByCreatedAtDesc(String sectionId);

	List<Resource> findAllByOrderByCreatedAtDesc();

	List<Resource> findByPublishedTrueOrderByCreatedAtDesc();

	List<Resource> findByPublishedTrueAndSectionIdOrderByCreatedAtDesc(String sectionId);

	/** Fetch specific resources by their IDs (regardless of published flag). */
	List<Resource> findByIdIn(Collection<Long> ids);

	@Transactional
	long deleteBySectionId(String sectionId);

	/**
	 * Postgres full-text search. Uses plainto_tsquery so users can type
	 * natural words ("solar system facts"), and ranks results by ts_rank.
	 * Stemming means a query for "volcano" matches "volcanic" / "volcanos".
	 */
	@Query(value = """
			SELECT r.* FROM resources r
			WHERE r.search_vector @@ plainto_tsquery('english', :q)
			ORDER BY ts_rank(r.search_vector, plainto_tsquery('english', :q)) DESC,
			         r.created_at DESC
			LIMIT 50
			""", nativeQuery = true)
	List<Resource> fullTextSearch(@Param("q") String query);
}
