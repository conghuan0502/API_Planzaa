require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const app = require('./app');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Start server
const PORT = process.env.PORT || 3000;

// Check if SSL certificates exist
const sslOptions = {
  key: fs.existsSync('./ssl/private.key') ? fs.readFileSync('./ssl/private.key') : null,
  cert: fs.existsSync('./ssl/certificate.crt') ? fs.readFileSync('./ssl/certificate.crt') : null
};

if (sslOptions.key && sslOptions.cert) {
  // Start HTTPS server
  const server = https.createServer(sslOptions, app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTPS Server is running on port ${PORT}`);
  });
} else {
  // Start HTTP server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP Server is running on port ${PORT}`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  if (server && server.close) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
}); 