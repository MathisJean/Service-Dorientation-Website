
//Set up libraries
const lockfile = require('proper-lockfile');
const fs = require('fs');
const {writeFile, readFile} = require('fs');
const path = require('path');
const express = require('express')
const router = express.Router()

//Setup Router
router.get('/', (req, res) => 
{
  res.render("accueil")
  res.end()
})

//Handle HTTP requests

let data_path = "database/orienteurs_data.json" //Path to data file

//Get bursary data from GET request
router.get("/data", (req, res) =>
  {
    readFile(data_path, (err, data) =>
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
        //Send if GET is complete
        res.send(parsed_data);
      };
    });
  });
  
  //Write bursary data from POST request
  router.post("/data", (req, res) =>
  {
    //Define incoming data
    const orienter_data = req.body; //Data must be in object form
  
    readFile(data_path, (err, data) =>
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
        last_obj = parsed_data.orienters.slice(-1)
        orienter_data.orienters[0].id = Number(last_obj[0].id) + 1
  
        parsed_data.orienters.push(orienter_data.orienters[0]); //Add obj to data
  
        lockfile.lock(data_path, {retries: {retries: 5}})
        .then((release) =>
        {
          //Write data to file
          writeFile(data_path, JSON.stringify(parsed_data), (err) => 
          {
            if (err)
            {
              console.error(err);
        
              //Set POST status to 404
              return res.status(404).send("Writing JSON file");
            }    
            else
            { 
              //Send if POST is complete
              res.send(parsed_data);
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
  router.put("/data", (req, res) =>
  {
    //Define incoming data
    const orienter_data = req.body; //Data must be in object form
  
    readFile(data_path, (err, data) =>
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
  
        if(parsed_data.orienters)
        {            
          for(i = 0; i <= parsed_data.orienters.length - 1; i++)
          {
            //Check for a record that matches the incoming data
            if(Number(parsed_data.orienters[i].id) === Number(orienter_data.orienters[0].id))
            {
              data_found = true;  
  
              parsed_data.orienters[i] = orienter_data.orienters[0];
  
              lockfile.lock(data_path, {retries: {retries: 5}})
              .then((release) =>
              {
                writeFile(data_path, JSON.stringify(parsed_data), (err) =>
                {
                  if (err)
                  {
                    console.error(err);
              
                    //Set PUT status to 404
                    return res.status(404).send("Writing JSON file");
                  }    
                  else
                  {       
                    //Send if PUT is complete
                    res.send(parsed_data);
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
  router.delete("/data", (req, res) =>
  {
    //Define incoming delete data
    const orienter_id = req.body.id; //Data must be in object form
  
    readFile(data_path, (err, data) =>
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
  
        if(parsed_data.orienters)
        {        
          for(i = 0; i <= parsed_data.orienters.length - 1; i++)
          {
            //Check for a record that matches the incoming data
            if(Number(parsed_data.orienters[i].id) === Number(orienter_id))
            {
              data_found = true;  
  
              parsed_data.orienters.splice(i, 1);
  
              lockfile.lock(data_path, {retries: {retries: 5}})
              .then((release) =>
              {
                writeFile(data_path, JSON.stringify(parsed_data), (err) =>
                {
                  if (err)
                  {
                    console.error(err);
              
                    //Set DELETE status to 404
                    return res.status(404).send("Writing JSON file");
                  }    
                  else
                  {       
                    //Send if DELETE is complete
                    res.send(parsed_data);
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

//Export router to server file
module.exports = router