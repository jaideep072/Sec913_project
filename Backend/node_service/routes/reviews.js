import express from 'express';
import Review from '../models/Review.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a specific resource
router.get('/', async (req, res) => {
  const { resourceId } = req.query;
  if (!resourceId) {
    return res.status(400).json({ code: 400, message: 'resourceId query parameter is required' });
  }

  try {
    const reviews = await Review.find({ resourceId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

// Create a review
router.post('/', authenticateToken, async (req, res) => {
  const { resourceId, reviewerName, rating, comment } = req.body;
  const reviewerEmail = req.user.email; // From validated token

  if (!resourceId || !reviewerName || !rating || !comment) {
    return res.status(400).json({ code: 400, message: 'All fields (resourceId, reviewerName, rating, comment) are required' });
  }

  try {
    const review = new Review({
      resourceId,
      reviewerName,
      reviewerEmail,
      rating,
      comment
    });

    const newReview = await review.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

// Delete a review
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ code: 404, message: 'Review not found' });
    }

    // Authorization: User must be either the author, a Librarian, or an Admin
    const isAuthor = review.reviewerEmail === req.user.email;
    const isPrivileged = req.user.role === 'Librarian' || req.user.role === 'Admin';

    if (!isAuthor && !isPrivileged) {
      return res.status(403).json({ code: 403, message: 'You are not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
});

export default router;
