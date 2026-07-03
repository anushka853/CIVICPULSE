import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import User from './models/userModel.js';
import userRoutes from './routes/userRoutes.js';
import issueRoutes from './routes/issueRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB().then(() => {
  seedDefaultUsers();
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] New connection: ${socket.id}`);

  socket.on('register', (userId) => {
    if (userId) {
      connectedUsers.set(userId.toString(), socket.id);
      console.log(`[Socket] Registered user ${userId} to socket ${socket.id}`);
      console.log('[Socket] Connected users list:', Array.from(connectedUsers.keys()));
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`[Socket] Removed user ${userId} from connected list`);
        break;
      }
    }
  });
});

export const sendRealTimeNotification = (userId, notification) => {
  if (userId) {
    const socketId = connectedUsers.get(userId.toString());
    if (socketId) {
      io.to(socketId).emit('notification', notification);
    }
  } else {
    io.emit('system-notification', notification);
  }
};

// Standard Middlewares
app.use(cors());
app.use(express.json());

// Serve uploads folder static assets
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

// Seed default users function
async function seedDefaultUsers() {
  try {
    const adminExists = await User.findOne({ email: 'admin@civicpulse.org' });
    if (!adminExists) {
      await User.create({
        name: 'Municipal Admin Office',
        email: 'admin@civicpulse.org',
        password: 'admin123',
        role: 'Admin',
        mobile: '9876543210',
        state: 'Bihar',
        district: 'Patna',
        city: 'Patna',
        village: 'Ward 12',
        pinCode: '800001',
        isVerified: true
      });
      console.log('Seeded default Admin user: admin@civicpulse.org / admin123');
    }

    const staffExists = await User.findOne({ email: 'staff@civicpulse.org' });
    if (!staffExists) {
      await User.create({
        name: 'Rohan Verma (Field Staff)',
        email: 'staff@civicpulse.org',
        password: 'staff123',
        role: 'Staff',
        mobile: '9876543211',
        state: 'Bihar',
        district: 'Patna',
        city: 'Patna',
        village: 'Ward 12',
        pinCode: '800001',
        serviceArea: 'Patna West Area',
        workingRadius: 10,
        isVerified: true
      });
      console.log('Seeded default Staff user: staff@civicpulse.org / staff123');
    }

    const citizenExists = await User.findOne({ email: 'citizen@civicpulse.org' });
    if (!citizenExists) {
      await User.create({
        name: 'Aarav (Citizen)',
        email: 'citizen@civicpulse.org',
        password: 'citizen123',
        role: 'Citizen',
        mobile: '9870543212',
        state: 'Bihar',
        district: 'Patna',
        city: 'Patna',
        village: 'Ward 12',
        pinCode: '800001',
        isVerified: true
      });
      console.log('Seeded default Citizen user: citizen@civicpulse.org / citizen123');
    }
  } catch (error) {
    console.error('Error seeding default users:', error);
  }
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

