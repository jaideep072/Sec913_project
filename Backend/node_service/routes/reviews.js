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

// Vector Search Endpoint
import { pipeline } from '@xenova/transformers';

let generateEmbedding = null;
const getEmbedder = async () => {
  if (!generateEmbedding) {
    console.log('Loading AI model for search...');
    generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return generateEmbedding;
};

router.get('/search/vector', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Search query 'q' is required" });
    }

    const embedder = await getEmbedder();
    const output = await embedder(q, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);

    // Use MongoDB Atlas $vectorSearch
    const results = await Review.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 100,
          limit: 5
        }
      },
      {
        $project: {
          _id: 1,
          resourceId: 1,
          reviewerName: 1,
          rating: 1,
          comment: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    res.json(results);
  } catch (error) {
    console.error("Vector search error:", error);
    res.status(500).json({ message: "Error performing vector search", error: error.message });
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

// Update a review
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ code: 404, message: 'Review not found' });
    }

    // Authorization: User must be either the author, a Librarian, or an Admin
    const isAuthor = review.reviewerEmail === req.user.email;
    const isPrivileged = req.user.role === 'Librarian' || req.user.role === 'Admin';

    if (!isAuthor && !isPrivileged) {
      return res.status(403).json({ code: 403, message: 'You are not authorized to edit this review' });
    }

    const { rating, comment } = req.body;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message });
  }
});

export default router;
