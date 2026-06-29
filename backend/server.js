import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import issueRoutes from './routes/issueRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Serve uploads folder static assets
// Since we are using ES modules, path.resolve() works beautifully
app.use('/uploads', express.static(path.resolve('uploads')));

// Mount API routes
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('CivicPulse AI API is running successfully...');
});

// Custom 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
