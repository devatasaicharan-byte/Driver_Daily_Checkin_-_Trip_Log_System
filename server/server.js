const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeDatabase } = require('./config/dbInit');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date(), dbType: process.env.DB_TYPE || 'json' });
});

// Register routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/checkins', require('./routes/checkinRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// 404 Route handler for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize DB and start server
async function startServer() {
  try {
    // Run database schemas and mock seeds
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`  Driver Daily Check-in & Trip Log Server API    `);
      console.log(`  Running on: http://localhost:${PORT}          `);
      console.log(`  Database Provider: ${(process.env.DB_TYPE || 'json').toUpperCase()}`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Server failed to start due to DB initialization error:', error);
    process.exit(1);
  }
}

// Trigger nodemon restart
startServer();
