
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import reviewsRouter from './routes/reviews.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 8002;

// In a real setup, we want to allow cross-origin requests from the Gateway (localhost:8000) and Frontend (localhost:5173)
app.use(cors());
app.use(express.json());

// Register routers
app.use('/reviews', reviewsRouter);

// Connect to MongoDB using Render's predictable internal DNS
const MONGODB_URI = 'mongodb://internal-mongo:27017/STEM';

console.log('Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB (Atlas) successfully!');
    app.listen(PORT, () => {
      console.log(`Node.js reviews service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to Local MongoDB:', err.message);
  });
