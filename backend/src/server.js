import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Database helpers and model relations.
import { connectDatabase, syncDatabase } from './config/database.js';
import './models/index.js';
// The four route "maps".
import productRoutes from './routes/productRoutes.js';
import customerGroupRoutes from './routes/customerGroupRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Create the web server.
const app = express();

// cors: allows the React app to call this server.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  })
);

// express.json: converts incoming JSON into JavaScript objects.
app.use(express.json());

// A tiny health check to confirm the server is alive.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Attach each group of API addresses under its own main path.
app.use('/api/products', productRoutes);
app.use('/api/customer-groups', customerGroupRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/ai', aiRoutes);

// The port the server listens on.
const PORT = process.env.PORT || 5000;

// The startup sequence, run in order.
async function start() {
  await connectDatabase();   // say hello to the database
  await syncDatabase();      // make sure tables exist
  app.listen(PORT, () => {   // start accepting requests
    console.log(`Offer decision assistant backend running on http://localhost:${PORT}`);
  });
}

// If anything fails while starting up, print the problem and stop.
start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});