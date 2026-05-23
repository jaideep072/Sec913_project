package mth.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import mth.models.BookRequest;
import mth.models.BookRequest.Status;

@Repository
public interface BookRequestRepository extends JpaRepository<BookRequest, Long> {

	List<BookRequest> findAllByOrderByCreatedAtDesc();

	List<BookRequest> findByStatusOrderByCreatedAtDesc(Status status);

	List<BookRequest> findByStudentEmailOrderByCreatedAtDesc(String studentEmail);
}
