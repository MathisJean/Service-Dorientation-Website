
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

// Get dymamic IP address
const networkInterfaces = os.networkInterfaces();

for (const interfaceName in networkInterfaces) 
{
  for (const interfaceInfo of networkInterfaces[interfaceName]) 
  {
    // Check if the network interface is IPv4 and not internal
    if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) 
    {
      host = interfaceInfo.address;
      port = process.env.PORT || 3000;
    }
  }
}

//Set static middleware
app.use(express.json())
app.use(express.static('public'));

//Set view engine
app.set("view engine", "ejs");

/***************************************************************************************************************************/

//Handle HTTP requests

//Get bursary data from GET request
app.get("/scholarship_data", (req, res) =>
{
  readFile("database/bourses_data.json", (err, data) =>
  {
    parsed_data = JSON.parse(data)

    if(err)
    {
      console.error(err);

      //Set DELETE status to 404
      res.status(404).send("Reading JSON file");
    }
    else if(parsed_data)
    {  
      const response = 
      { 
        scholarships: parsed_data.scholarships.map(scholarship =>
        ({
          id: scholarship.id,
          name: scholarship.name,
          date: scholarship.date,
          criteria: scholarship.criteria,
          value: scholarship.value,
          link: scholarship.link,
          subscribedUsers: scholarship.subscribedUsers.length //Remove user email from res         
        })) 
      };

      //Send if POST is complete
      res.send(response);
    };
  });
});

//Write bursary data from POST request
app.post("/scholarship_data", (req, res) =>
{
  //Define incoming data
  const scholarship_data = req.body; //Data must be in object form

  readFile("database/bourses_data.json", (err, data) =>
  {
    if(err)
    {
      console.error(err);

      //Set POST status to 404
      return res.status(404).send("Reading JSON file");
    }
    else if(data)
    {     
      let parsed_data = JSON.parse(data); //Convert json data to object

      //Increment id from last obj id
      last_obj = parsed_data.scholarships.slice(-1)
      scholarship_data.scholarships[0].id = Number(last_obj[0].id) + 1

      parsed_data.scholarships.push(scholarship_data.scholarships[0]); //Add obj to data

      lockfile.lock("database/bourses_data.json", {retries: {retries: 5}})
      .then((release) =>
      {
        //Write data to file
        writeFile("database/bourses_data.json", JSON.stringify(parsed_data), (err) => 
        {
          if (err)
          {
            console.error(err);
      
            //Set POST status to 404
            return res.status(404).send("Writing JSON file");
          }    
          else
          {
            const response = 
            { 
              scholarships: parsed_data.scholarships.map(scholarship =>
              ({
                id: scholarship.id,
                name: scholarship.name,
                date: scholarship.date,
                criteria: scholarship.criteria,
                value: scholarship.value,
                link: scholarship.link,
                subscribedUsers: scholarship.subscribedUsers.length //Remove user email from res         
              })) 
            };

            //Send if POST is complete
            res.send(response);
          };   
        });

        return release();
      })
      .catch(err => 
      {
        console.log(err)

        res.status(503).send("Locking JSON file");
      });
    };
  });
});

//Write bursary data from PUT request
app.put("/scholarship_data", (req, res) =>
{
  //Define incoming data
  const scholarship_data = req.body; //Data must be in object form

  readFile("database/bourses_data.json", (err, data) =>
  {
    if(err)
    {
      console.error(err);

      //Set PUT status to 404
      return res.status(404).send("Reading JSON file");
    }
    else if(data)
    {     
      let parsed_data = JSON.parse(data); //Convert json data to object
      let data_found = false;

      if(parsed_data.scholarships)
      {            
        for(i = 0; i <= parsed_data.scholarships.length - 1; i++)
        {
          //Check for a record that matches the incoming data
          if(Number(parsed_data.scholarships[i].id) === Number(scholarship_data.scholarships[0].id))
          {
            data_found = true;  

            parsed_data.scholarships[i] = scholarship_data.scholarships[0];

            lockfile.lock("database/bourses_data.json", {retries: {retries: 5}})
            .then((release) =>
            {
              writeFile("database/bourses_data.json", JSON.stringify(parsed_data), (err) =>
              {
                if (err)
                {
                  console.error(err);
            
                  //Set PUT status to 404
                  return res.status(404).send("Writing JSON file");
                }    
                else
                {
                  const response = 
                  { 
                    scholarships: parsed_data.scholarships.map(scholarship =>
                    ({
                      id: scholarship.id,
                      name: scholarship.name,
                      date: scholarship.date,
                      criteria: scholarship.criteria,
                      value: scholarship.value,
                      link: scholarship.link,
                      subscribedUsers: scholarship.subscribedUsers.length //Remove user email from res         
                    })) 
                  };
      
                  //Send if POST is complete
                  res.send(response);
                };   
              });
                
              return release();
            })
            .catch(err => 
            {
              console.log(err)
      
              res.status(503).send("Locking JSON file");
            });
  
            break;
          }
        };
      };

      //If data not found in json file
      if(!data_found)
      {
        res.status(404).send("Data not found in json file");
      };
    };
  });
});

//Write bursary data from DELETE request
app.delete("/scholarship_data", (req, res) =>
{
  //Define incoming delete data
  const scholarship_id = req.body.id; //Data must be in object form

  readFile("database/bourses_data.json", (err, data) =>
  {
    if(err)
    {
      console.error(err);

      //Set DELETE status to 404
      return res.status(404).send("Reading JSON file");
    }
    else if(data)
    {     
      let parsed_data = JSON.parse(data); //Convert json data to object
      let data_found = false;

      if(parsed_data.scholarships)
      {        
        for(i = 0; i <= parsed_data.scholarships.length - 1; i++)
        {
          //Check for a record that matches the incoming data
          if(Number(parsed_data.scholarships[i].id) === Number(scholarship_id))
          {
            data_found = true;  

            parsed_data.scholarships.splice(i, 1);

            lockfile.lock("database/bourses_data.json", {retries: {retries: 5}})
            .then((release) =>
            {
              writeFile("database/bourses_data.json", JSON.stringify(parsed_data), (err) =>
              {
                if (err)
                {
                  console.error(err);
            
                  //Set DELETE status to 404
                  return res.status(404).send("Writing JSON file");
                }    
                else
                {
                  const response = 
                  { 
                    scholarships: parsed_data.scholarships.map(scholarship =>
                    ({
                      id: scholarship.id,
                      name: scholarship.name,
                      date: scholarship.date,
                      criteria: scholarship.criteria,
                      value: scholarship.value,
                      link: scholarship.link,
                      subscribedUsers: scholarship.subscribedUsers.length //Remove user email from res         
                    })) 
                  };
      
                  //Send if POST is complete
                  res.send(response);
                };   
              });
                
              return release();
            })
            .catch(err => 
            {
              console.log(err)
      
              res.status(503).send("Locking JSON file");
            });;
  
            break;
          }
        };
      }
      //If data not found in json file
      if(!data_found)
      {
        res.status(404).send("Data not found in json file");
      };
    };
  });
});

app.post('/account_data', (req, res) =>
{
  console.log("received post request");
});

app.post('/blog_data', (req, res) =>
{
  console.log("received post request");
});

//Home page
app.get('/' , (req, res) => 
  {
    res.render("accueil");
    res.status(200);
    return res.end();
  });

//Expériences
const experiencesRouter = require('./routes/experiences');

app.use('/experiences', experiencesRouter);

//Cours
const coursRouter = require('./routes/cours');

app.use('/cours', coursRouter);

//Bourses
const boursesRouter = require('./routes/bourses');

app.use('/bourses', boursesRouter);

//Error
app.use((req, res) => 
{
  res.status(404).render("error");
});

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