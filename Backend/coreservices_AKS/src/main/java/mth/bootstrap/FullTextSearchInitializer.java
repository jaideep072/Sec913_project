package mth.bootstrap;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Adds Postgres full-text search infrastructure to the `resources` table
 * if it isn't already there. Runs after Hibernate's auto-DDL, so the
 * table is guaranteed to exist by the time we touch it.
 *
 *   search_vector  tsvector  — generated from title + summary + body + tags
 *   idx_resources_search    — GIN index for fast ts_query matching
 *
 * Idempotent: every statement is `IF NOT EXISTS` or guarded by a catalog check,
 * so re-running on every boot is fine.
 */
@Component
@Order(50) // before DataSeeder (which is Order Integer.MAX by default)
public class FullTextSearchInitializer implements CommandLineRunner {

	private final JdbcTemplate jdbc;

	public FullTextSearchInitializer(DataSource ds) {
		this.jdbc = new JdbcTemplate(ds);
	}

	@Override
	public void run(String... args) {
		// Add the generated tsvector column (catalog check first — Postgres < 12 lacks
		// "ADD COLUMN IF NOT EXISTS" for generated columns in some versions).
		Integer exists = jdbc.queryForObject(
				"select count(*) from information_schema.columns " +
				"where table_name = 'resources' and column_name = 'search_vector'",
				Integer.class);

		if (exists == null || exists == 0) {
			jdbc.execute(
					"ALTER TABLE resources ADD COLUMN search_vector tsvector " +
					"GENERATED ALWAYS AS ( " +
					"  to_tsvector('english', " +
					"    coalesce(title,'')   || ' ' || " +
					"    coalesce(summary,'') || ' ' || " +
					"    coalesce(body,'')    || ' ' || " +
					"    coalesce(author,'')  || ' ' || " +
					"    coalesce(tags,'')) " +
					") STORED"
			);
		}

		jdbc.execute("CREATE INDEX IF NOT EXISTS idx_resources_search " +
				"ON resources USING GIN (search_vector)");
	}
}
