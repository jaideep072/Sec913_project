import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import reviewsRouter from './routes/reviews.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

// In a real setup, we want to allow cross-origin requests from the Gateway (localhost:8000) and Frontend (localhost:5173)
app.use(cors());
app.use(express.json());

// Register routers
app.use('/reviews', reviewsRouter);

// Database connection URI from environment variable or user's provided Atlas cluster URI as default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://test:admin@cluster0.hxyc73f.mongodb.net/Accessible_Knowledge_System?appName=Cluster0';

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    app.listen(PORT, () => {
      console.log(`Node.js reviews service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
