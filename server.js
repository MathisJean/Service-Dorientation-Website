
//Set up libraries
const https = require('https');
const os = require('os');

const fs = require('fs');
const path = require('path');

const express = require('express');
const app = express();

const rateLimit = require("express-rate-limit");

let host = "localhost";
let port = process.env.PORT || 3000;

//Get dymamic IP address
const networkInterfaces = os.networkInterfaces();

for (const iface of Object.values(networkInterfaces))
{
  for (const ifaceInfo of iface) 
  {
    if (ifaceInfo.family === "IPv4" && !ifaceInfo.internal) 
    {
      host = ifaceInfo.address;
    };
  };
};

//TODO: Fix Rate limiter
//Rate limiter
const limiter = rateLimit(
{
  windowMs: 15 * 60 * 1000, //15 minutes
  max: 100, //Limit each IP to 100 requests per `windowMs`
  message: "Too many requests, please try again later.",
  standardHeaders: true, //Return rate limit info in headers
  legacyHeaders: false, //Disable `X-RateLimit-*` headers
});

//Set static middleware
//app.use(limiter)

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

//Set view engine
app.set("view engine", "ejs");

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

//Blogues
const bloguesRouter = require('./routes/blogues');

app.use('/blogues', bloguesRouter)

//Error
app.use((req, res) => 
{
  res.status(404).render("error");
});

//Create https server
const sslServer = https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem"))
  }, app)

//Start up server
sslServer.listen(port, host, () =>  
{
  console.log(`Server running at https://${host}:${port} close it with CTRL + C`);
  
  //Start scholarship reminder schedule
  require("./email_task_scheduler");
});
