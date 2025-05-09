
//Set up libraries
const fs = require('fs');
const path = require('path');

const lockfile = require('proper-lockfile');

const express = require('express')
const router = express.Router()

const handle_api_error = require("../lib/error_handler.js");
const email_authentication = require("../lib/email_authentication.js");
const {encrypt, decrypt, http_encryption} = require("../lib/encryption.js");
const {server_public_key, server_private_key, get_client_public_key} = require("../lib/keys.js");

//Setup Router
router.get('/', (req, res) => 
{
  res.render("bourses")
  res.end()
})

//----Handle HTTP requests----//

//href to JSON files
let scholarship_path = "database/bourses_data.json" //Path to data file

//---Scholarship---//

//Scholarship GET HTTP request
router.get("/scholarship", async (req, res) =>
{
  try
  {
    //Read file
    let scholarship_data = await fs.promises.readFile(scholarship_path, "utf-8");

    scholarship_data = decrypt(scholarship_data); //Decrypt data

    //Define data
    let scholarships = scholarship_data?.scholarships;

    //Return response
    return res.send(http_encryption(JSON.stringify(scholarships), get_client_public_key()));
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});

//Scholarship POST HTTP request
router.post("/scholarship", async (req, res) =>
{
  //Define incoming data
  const request_data = req.body.scholarships[0];
  
  try
  {
    //Read file
    let scholarship_data = await fs.promises.readFile(scholarship_path, "utf-8");

    scholarship_data = decrypt(scholarship_data); //Decrypt data

    //Define data
    let scholarships = scholarship_data?.scholarships;

    //Increment id from last record
    let last_scholarship = scholarships.slice(-1)[0];
    request_data.id = Number(last_scholarship.id) + 1

    //Add new record to scholarships
    scholarships.push((request_data))

    //Lock file
    await lockfile.lock(scholarship_path, {retries: { retires: 5 } });

    try
    {
      //Write file
      await fs.promises.writeFile(scholarship_path, encrypt({scholarships})) //Encrypt data
    }
    finally
    {
      try
      {
        //Unlock file
        await lockfile.unlock(scholarship_path);        
      }
      catch(err)
      {
        console.error("Unlock failed")
      };
    };
    //Return response
    return res.send(http_encryption(JSON.stringify(scholarships), get_client_public_key())) 
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res);
  }
});

//Scholarship PUT HTTP request
router.put("/scholarship", async (req, res) =>
{
  //Define incoming data
  const request_data = req.body.scholarships[0];

  request_data.date.day = Number(request_data.date.day);

  try
  {
    //Read file
    let scholarship_data = await fs.promises.readFile(scholarship_path, "utf-8");

    scholarship_data = decrypt(scholarship_data); //Decrypt data

    //Define data
    let scholarships = scholarship_data?.scholarships;
    let scholarship_found = false;

    if(scholarships)
    {        
      for(let i = 0; i < scholarships.length; i++) //Loop through scholarships
      {
        //If record matches incoming data
        if(Number(scholarships[i].id) === Number(request_data.id)) 
        {
          scholarship_found = true;

          //Array of key from request_data
          Object.values(request_data).forEach((request_key, index) =>
          {
            //If key value is empty, keep original value
            if(String(request_key) !== "")
            {
              key = Object.keys(scholarships[i])[index];

              scholarships[i][key] = Number(request_key)? Number(request_key) : String(request_key) !== "[object Object]" ? String(request_key) : request_key; 
            };
          })

          //Lock file
          await lockfile.lock(scholarship_path, {retries: { retires: 5 } });

          try
          {
            //Write file
            await fs.promises.writeFile(scholarship_path, encrypt({scholarships})) //Encrypt data
          }
          finally
          {
            try
            {
              //Unlock file
              await lockfile.unlock(scholarship_path);        
            }
            catch(err)
            {
              console.error("Unlock failed")
            };
          };
        };
      };
      //Throw error if file not found
      if(!scholarship_found)
      {
        let err = new Error("Data not found");
        err.code = "ENOENT";
        throw err;
      }
    };
    //Return response
    return res.send({msg: "Successful"}) 
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});

//Scholarship DELETE HTTP request
router.delete("/scholarship/:id", async (req, res) =>
{
  //Define incoming data
  const request_id = req.params.id;

  try
  {
    //Read file
    let scholarship_data = await fs.promises.readFile(scholarship_path, "utf-8");

    scholarship_data = decrypt(scholarship_data); //Decrypt data

    //Define data
    let scholarships = scholarship_data?.scholarships;
    let scholarship_found = false;

    if(scholarships)
    {        
      for(let i = 0; i < scholarships.length; i++) //Loop through scholarships
      {
        //If record matches incoming data
        if(Number(scholarships[i].id) === Number(request_id)) 
        {
          scholarship_found = true;

          scholarships.splice(i, 1);

          //Lock file
          await lockfile.lock(scholarship_path, {retries: { retires: 5 } });

          try
          {
            //Write file
            await fs.promises.writeFile(scholarship_path, encrypt({scholarships})) //Encrypt data
          }
          finally
          {
            try
            {
              //Unlock file
              await lockfile.unlock(scholarship_path);        
            }
            catch(err)
            {
              console.error("Unlock failed")
            };
          };
        };
      };
      //Throw error if file not found
      if(!scholarship_found)
      {
        let err = new Error("Data not found");
        err.code = "ENOENT";
        throw err;
      }
    };
    //Return response
    return res.send({msg: "Successful"}) 
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});

//----Subscriptions----//

//Subscription POST HTTP request
router.post("/subscribe/:id", async (req, res) => 
{
  //Define incoming data
  const scholarship_id = req.params.id;
  const scholarship_email = JSON.parse(req.body.email);

  try
  {
    //Read file
    let scholarship_data = await fs.promises.readFile(scholarship_path, "utf-8");

    scholarship_data = decrypt(scholarship_data); //Decrypt data

    let scholarships = scholarship_data?.scholarships;
    let scholarship_found = false;

    //Update scholarship subscriptions
    if(scholarships)
    {
      for(let scholarship of scholarships)
      {
        if(Number(scholarship.id) === Number(scholarship_id)) 
        {
          scholarship_found = true;

          if(!scholarship.subscribedUsers.includes(scholarship_email))
          {
              scholarship.subscribedUsers.push(scholarship_email);
          };
          
          break;
        };
      };
      //Throw error if file not found
      if(!scholarship_found)
      {
        let err = new Error("Data not found");
        err.code = "ENOENT";
        throw err;
      };      
    };

    //Lock file
    await lockfile.lock(scholarship_path, { retries: { retries: 5 } })

    try
    {
      //Write file
      await fs.promises.writeFile(scholarship_path, JSON.stringify({scholarships}, null, 2))
    }
    finally
    {
      try 
      {
        await lockfile.unlock(scholarship_path)
      }
      catch(err)
      {
        console.error("Unlock failed");
      };
    };
    //Return response
    return res.send({msg: "Successful"});
  } 
  catch(err) 
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});

//Subscription DELETE HTTP request
router.delete("/subscribe/:id", async (req, res) => 
{
  //define incoming data
  const scholarship_id = req.params.id;
  const scholarship_email = JSON.parse(req.body.email);

  try
  {
    //Read file
    let scholarship_data = await fs.promises.readFile(scholarship_path, "utf-8");

    scholarship_data = decrypt(scholarship_data); //Decrypt data

    let scholarships = scholarship_data?.scholarships;
    let scholarship_found = false;

    //Update scholarship subscriptions
    if(scholarships)
    {
      for(let scholarship of scholarships)
      {
        if(Number(scholarship.id) === Number(scholarship_id)) 
        {
          scholarship_found = true;

          //Remove Email from subscribed users
          scholarship.subscribedUsers = scholarship.subscribedUsers.filter(email => String(email) !== String(scholarship_email))
          
          break;
        };
      }; 
      //Throw error if file not found
      if(!scholarship_found)
      {
        let err = new Error("Data not found");
        err.code = "ENOENT";
        throw err;
      };  
    };

    //Lock files  
    await lockfile.lock(scholarship_path, { retries: { retries: 5 } })

    try
    {
      //Write file
      await fs.promises.writeFile(scholarship_path, JSON.stringify({scholarships}, null, 2))
    }
    finally
    {
      try 
      {
        await lockfile.unlock(scholarship_path)
      }
      catch(err)
      {
        console.error("Unlock failed");
      }
    };
    //Return response
    return res.send({msg: "Successful"});
  } 
  catch(err) 
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});

//Export router to server file
module.exports = router