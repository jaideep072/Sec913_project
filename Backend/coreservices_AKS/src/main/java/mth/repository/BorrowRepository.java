package mth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import mth.models.Borrow;

@Repository
public interface BorrowRepository extends JpaRepository<Borrow, Long> {

	List<Borrow> findAllByOrderByBorrowedOnDesc();

	List<Borrow> findByBorrowerEmailOrderByBorrowedOnDesc(String borrowerEmail);

	/** Currently-out borrow for this student + this resource (returnedOn IS NULL). */
	boolean existsByBorrowerEmailAndResourceIdAndReturnedOnIsNull(String borrowerEmail, Long resourceId);

	/** All active borrows for a given student (not yet returned). */
	List<Borrow> findByBorrowerEmailAndReturnedOnIsNull(String borrowerEmail);
}
