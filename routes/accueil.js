
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
let account_path = "database/account_data.json" //Path to account data file

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
      let last_obj = parsed_data.orienters.slice(-1)
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

  readFile(account_path, (err, data) =>
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

            Object.values(orienter_data.orienters[0]).forEach((key_value, index) =>
            {
              if(String(key_value) == "/clear/" && index == Object.keys(parsed_data.orienters[i]).length - 1)
              {
                key = Object.keys(parsed_data.orienters[i])[index];

                parsed_data.orienters[i][key] = "";    
              }

              else if(String(Object.values(parsed_data.orienters[i])[index]) !== String(key_value) && String(key_value) !== "")
              {
                key = Object.keys(parsed_data.orienters[i])[index];

                parsed_data.orienters[i][key] = key_value;           
              };
            });

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

router.post("/account_data", (req, res) => 
{
  const account_data = req.body; // Data must be in object form

  const user_name = account_data.accounts[0]?.name;
  const user_email = account_data.accounts[0]?.email;
  const user_password = account_data.accounts[0]?.password;

  if (!user_email || !user_password) 
  {
    return res.status(400).send("Invalid request data");
  }

  readFile(account_path, (err, data) => 
  {
    if(err) 
    {
      console.error(err);
      return res.status(500).send("Error reading JSON file");
    }

    try 
    {
      console.log("Reading File")

      const parsed_data = JSON.parse(data);
      const found_account = parsed_data.accounts.find((acc) => acc.email === user_email); //Search if email is already in use

      let last_obj = parsed_data.accounts.slice(-1)
      account_data.accounts[0].id = Number(last_obj[0].id) + 1

      parsed_data.accounts.push(account_data.accounts[0]); //Add obj to data

      if(!found_account) 
      {
        console.log("Account Not Found")

        lockfile.lock(account_path, {retries: {retries: 5}})
        .then((release) =>
        {
          //Write data to file
          writeFile(account_path, JSON.stringify(parsed_data), (err) => 
          {
            if(err)
            {
              console.error(err);
        
              //Set POST status to 404
              return res.status(404).send("Writing JSON file");
            }    
            else
            { 
              account_data.accounts[0].password = "****"

              //Send if POST is complete
              res.send(account_data.accounts[0]);
            };   
          });
  
          return release();
        })
        .catch(err => 
        {
          console.log(err)
  
          res.status(503).send("Locking JSON file");
        });
      } 
      else 
      {
        return res.status(404).send("E-mail déjà utilisé");
      };
    }     
    catch(parseError)
    {
      return res.status(500).send("Error Parsing JSON File");
    };
  });
});

router.put("/account_data", (req, res) => 
{
  const account_data = req.body; // Data must be in object form
  const user_email = account_data.accounts[0]?.email;
  const user_password = account_data.accounts[0]?.password;

  if (!user_email || !user_password) 
  {
    return res.status(400).send("Invalid request data");
  }

  readFile(account_path, (err, data) => 
  {
    if(err) 
    {
      console.error(err);
      return res.status(500).send("Error reading JSON file");
    }

    try 
    {
      const parsed_data = JSON.parse(data);
      const account = parsed_data.accounts.find((acc) => acc.email === user_email && acc.password === user_password);

      account.password = "****"

      if(account) 
      {
        return res.send(account);
      } 
    }     
    catch(err)
    {
      return res.status(404).send("Compte introuvable");
    };
  });
});


//Export router to server file
module.exports = router