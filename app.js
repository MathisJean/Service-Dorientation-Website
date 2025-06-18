const http = require('http');
const express = require('express');
const app = express();

const port = 8080;
const host = '0.0.0.0';

// Create server first
const server = http.createServer(app);

// Now handle SIGTERM gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down gracefully');
  server.close(() => {
    console.log('Server closed. Exiting now.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing exit after timeout');
    process.exit(1);
  }, 10000);
});

// Start server
server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
