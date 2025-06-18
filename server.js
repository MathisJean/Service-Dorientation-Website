
//Set up libraries
const http = require('http');
const os = require('os');

const fs = require('fs');
const path = require('path');

const express = require('express');
const app = express();

//Security libraries
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

let host = "0.0.0.0";
let port = 8080;

//Set static middleware
app.use((req, res, next) => 
  {
  res.setHeader("Content-Security-Policy", 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' blob: data:; " +
    "frame-src 'self' https://www.youtube.com;"
  );
  next();
});

app.use(express.json({ limit: "10mb" })); // Increase limit to 10MB
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static('public'));

//Security features
//app.use(helmet());
//app.use(cors({ origin: 'https://yourfrontend.com', credentials: true })); //TODO: change URL
//app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json());

//Set view engine
app.set("view engine", "ejs");

//----HTTP Encryption---//

const {server_public_key, server_private_key, get_client_public_key, set_client_public_key, } = require("./lib/keys.js");

//Send public key
app.get("/public_key/serverside", (req, res) =>
{
    return res.send({key: server_public_key})
})
  
//Receive public key
app.post("/public_key/clientside", (req, res) =>
{
    set_client_public_key(req.body.key);

    return res.send({msg: "Successful"})
})

//----Using Routers----//

//Accueil
const accueilRouter = require('./routes/accueil');
app.use('/', accueilRouter);

//Expériences
const experiencesRouter = require('./routes/experiences');
app.use('/experiences', experiencesRouter);

//Cours
const coursRouter = require('./routes/cours');
app.use('/cours', coursRouter);

//Bourses
const boursesRouter = require('./routes/bourses');
app.use('/bourses', boursesRouter);

//Resources
const resourcesRouter = require('./routes/resources');
app.use('/resources', resourcesRouter);

//Error
app.use((req, res) => 
{
  res.status(404).render("error");
});

//Create https server
const server = http.createServer(app);

process.on("unhandledRejection", err => {
  console.error("Unhandled rejection:", err);
});
process.on("uncaughtException", err => {
  console.error("Uncaught exception:", err);
});
process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down gracefully');
  // e.g. close database connections, stop timers, etc.
  server.close(() => {
    console.log('Server closed. Exiting now.');
    process.exit(0);
  });

  // If server.close() hangs, force exit after some timeout
  setTimeout(() => {
    console.error('Forcing exit after timeout');
    process.exit(1);
  }, 10000); // 10 seconds
});

server.listen(port, host, () => {
  console.log("Starting email task scheduler...");
  try
  {
    require("./email_task_scheduler");
    console.log("Email scheduler loaded.");
  } 
  catch 
  (err) 
  {
    console.error("Email scheduler failed to load:", err);
  }
});