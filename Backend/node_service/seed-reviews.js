import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import { pipeline } from '@xenova/transformers';
import Review from './models/Review.js';
import dotenv from 'dotenv';
dotenv.config();

const dummyReviews = [
  { resourceId: "1", reviewerName: "Alice", reviewerEmail: "alice@example.com", rating: 5, comment: "This book is fantastic. It explains quantum physics in a very easy to understand way." },
  { resourceId: "2", reviewerName: "Bob", reviewerEmail: "bob@example.com", rating: 4, comment: "Great resource for learning Python programming. Highly recommended for beginners." },
  { resourceId: "3", reviewerName: "Charlie", reviewerEmail: "charlie@example.com", rating: 3, comment: "The historical analysis was okay, but a bit dry. Could use more engaging examples." },
  { resourceId: "4", reviewerName: "Diana", reviewerEmail: "diana@example.com", rating: 5, comment: "An absolute masterpiece of classical literature. The character development is unmatched." },
  { resourceId: "1", reviewerName: "Eve", reviewerEmail: "eve@example.com", rating: 2, comment: "I found the physics concepts too advanced. Not suitable for someone without a math background." },
  { resourceId: "5", reviewerName: "Frank", reviewerEmail: "frank@example.com", rating: 4, comment: "A comprehensive guide to machine learning algorithms. Very useful for my research." },
  { resourceId: "2", reviewerName: "Grace", reviewerEmail: "grace@example.com", rating: 5, comment: "Python crash course was exactly what I needed to kickstart my coding journey!" },
  { resourceId: "6", reviewerName: "Hank", reviewerEmail: "hank@example.com", rating: 4, comment: "The recipes in this cookbook are delicious and easy to follow." },
  { resourceId: "7", reviewerName: "Ivy", reviewerEmail: "ivy@example.com", rating: 1, comment: "Terrible novel. The plot made no sense and the ending was completely rushed." },
  { resourceId: "5", reviewerName: "Jack", reviewerEmail: "jack@example.com", rating: 5, comment: "Deep learning section was incredibly insightful. Best textbook on AI I've read." }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.q9ybvvg.mongodb.net/STEM?retryWrites=true&w=majority&appName=Cluster0';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    // Initialize transformer pipeline
    console.log('Loading AI model for embeddings (this may take a minute the first time)...');
    const generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    console.log('Clearing old reviews...');
    await Review.deleteMany({});

    console.log('Generating embeddings and saving reviews...');
    for (const reviewData of dummyReviews) {
      // Generate embedding
      const output = await generateEmbedding(reviewData.comment, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);
      
      const review = new Review({
        ...reviewData,
        embedding: embedding
      });
      await review.save();
      console.log(`Saved review by ${review.reviewerName}`);
    }

    console.log('Successfully seeded database with vector embeddings!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
