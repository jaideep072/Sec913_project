import mongoose from 'mongoose';
import express from 'express';
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

// Connect to Local MongoDB Server
const MONGODB_URI = 'mongodb://127.0.0.1:27017/STEM';

console.log('Connecting to Local MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to Local MongoDB successfully!');
    app.listen(PORT, () => {
      console.log(`Node.js reviews service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to Local MongoDB:', err.message);
    process.exit(1);
  });
