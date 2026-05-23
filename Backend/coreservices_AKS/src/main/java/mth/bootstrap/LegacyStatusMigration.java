package mth.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time migration: converts any lingering {@code AWAITING_ADMIN} rows
 * in the book_requests table to {@code PENDING} so they can be handled
 * by the new single-step librarian approval flow.
 *
 * In the old flow:
 *   Student → PENDING → Librarian approves → AWAITING_ADMIN → Admin confirms → APPROVED
 *
 * New flow:
 *   Student → PENDING → Librarian approves → APPROVED (borrow created immediately)
 *
 * Rows stuck at AWAITING_ADMIN are reset to PENDING so a librarian can
 * re-approve them under the new rules (which auto-create the Borrow record).
 *
 * This runs AFTER DataSeeder (Order(2)) and is idempotent — subsequent runs
 * won't find any AWAITING_ADMIN rows and will simply log 0.
 */
@Component
@Order(2)
public class LegacyStatusMigration implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(LegacyStatusMigration.class);

	private final JdbcTemplate jdbc;

	public LegacyStatusMigration(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(String... args) {
		int updated = jdbc.update(
			"UPDATE book_requests SET status = 'PENDING', decision_by = NULL, " +
			"decision_at = NULL, decision_notes = NULL, linked_borrow_id = NULL " +
			"WHERE status = 'AWAITING_ADMIN'"
		);
		if (updated > 0) {
			log.warn("Migrated {} legacy AWAITING_ADMIN request(s) → PENDING. " +
				"A librarian can now re-approve them under the new single-step flow.", updated);
		} else {
			log.info("No legacy AWAITING_ADMIN rows found (clean).");
		}
	}
}
