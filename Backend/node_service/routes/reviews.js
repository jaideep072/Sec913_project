import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

let reviewsList = [];
let nextId = 1;

// Get reviews for a specific resource
router.get('/', (req, res) => {
  const { resourceId } = req.query;
  if (!resourceId) {
    return res.status(400).json({ code: 400, message: 'resourceId query parameter is required' });
  }

  const filtered = reviewsList.filter(r => r.resourceId === resourceId);
  res.json(filtered);
});

// Vector Search Endpoint (Disabled for In-Memory)
router.get('/search/vector', (req, res) => {
  res.status(501).json({ message: "Vector search disabled in in-memory mode" });
});

// Create a review
router.post('/', authenticateToken, (req, res) => {
  const { resourceId, reviewerName, rating, comment } = req.body;
  const reviewerEmail = req.user.email; // From validated token

  if (!resourceId || !reviewerName || !rating || !comment) {
    return res.status(400).json({ code: 400, message: 'All fields (resourceId, reviewerName, rating, comment) are required' });
  }

  const newReview = {
    _id: String(nextId++),
    resourceId,
    reviewerName,
    reviewerEmail,
    rating,
    comment,
    createdAt: new Date()
  };

  reviewsList.push(newReview);
  res.status(201).json(newReview);
});

// Delete a review
router.delete('/:id', authenticateToken, (req, res) => {
  const idx = reviewsList.findIndex(r => r._id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ code: 404, message: 'Review not found' });
  }

  const review = reviewsList[idx];
  const isAuthor = review.reviewerEmail === req.user.email;
  const isPrivileged = req.user.role === 'Librarian' || req.user.role === 'Admin';

  if (!isAuthor && !isPrivileged) {
    return res.status(403).json({ code: 403, message: 'You are not authorized to delete this review' });
  }

  reviewsList.splice(idx, 1);
  res.json({ message: 'Review deleted successfully' });
});

// Update a review
router.put('/:id', authenticateToken, (req, res) => {
  const idx = reviewsList.findIndex(r => r._id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ code: 404, message: 'Review not found' });
  }

  const review = reviewsList[idx];
  const isAuthor = review.reviewerEmail === req.user.email;
  const isPrivileged = req.user.role === 'Librarian' || req.user.role === 'Admin';

  if (!isAuthor && !isPrivileged) {
    return res.status(403).json({ code: 403, message: 'You are not authorized to edit this review' });
  }

  const { rating, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  reviewsList[idx] = review;
  res.json(review);
});

export default router;
