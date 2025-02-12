
//Set up libraries
const http = require('http');
const https = require('https');
const lockfile = require('proper-lockfile');
const os = require('os');
const fs = require('fs');
const {writeFile, readFile} = require('fs');
const path = require('path');
const express = require('express');
const app = express();

let host;
let port;

//Get dymamic IP address
const networkInterfaces = os.networkInterfaces();

for (const interfaceName in networkInterfaces) 
{
  for (const interfaceInfo of networkInterfaces[interfaceName]) 
  {
    //Check if the network interface is IPv4 and not internal
    if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) 
    {
      host = interfaceInfo.address;
      port = process.env.PORT || 3000;

      break
    }
  }
}

//Set static middleware
app.use(express.json())
app.use(express.static('public'));

//Set view engine
app.set("view engine", "ejs");


//----Using Routers----

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
});