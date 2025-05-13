
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
  res.render("experiences")
  res.end()
})

//----Handle HTTP requests----//

let exhibitor_path = "database/experiences_data.json" //Path to data file

//---Exhibitor---//

//Exhibitor Get HTTP request
router.get("/exhibitor", async (req, res) =>
{
  try
  {
    //Read file
    let exhibitor_data = await fs.promises.readFile(exhibitor_path);

    exhibitor_data = decrypt(exhibitor_data); //Decrypt data

    //Define data
    let exhibitors = exhibitor_data?.exhibitors;

    //Return response
    return res.send(http_encryption(JSON.stringify(exhibitors), get_client_public_key())) 
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});

//Exhibitor Post HTTP request
router.post("/exhibitor", async (req, res) =>
{
  //Define incoming data
  const request_data = req.body.exhibitors[0];
  
  try
  {
    //Read file
    let exhibitor_data = await fs.promises.readFile(exhibitor_path);

    exhibitor_data = decrypt(exhibitor_data); //Decrypt data

    //Define data
    let exhibitors = exhibitor_data?.exhibitors;

    let last_exhibitor

    //Increment id from last record
    if(exhibitors.length > 0)
    {
      last_exhibitor = exhibitors.slice(-1)[0];      
    }
    else
    {
      last_exhibitor = {id: 0}
    };

    request_data.id = Number(last_exhibitor.id) + 1

    //Add new record to orienters
    exhibitors.push((request_data))

    //Lock file
    await lockfile.lock(exhibitor_path, {retries: { retires: 5 } });

    try
    {
      //Write file
      await fs.promises.writeFile(exhibitor_path, encrypt({exhibitors}), null, 2) //Encrypt data
    }
    finally
    {
      try
      {
        //Unlock file
        await lockfile.unlock(exhibitor_path);        
      }
      catch(err)
      {
        console.error("Unlock failed")
      };
    };

    //Return response
    return res.send(http_encryption(JSON.stringify(request_data), get_client_public_key())) 
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res);
  }
});

//Exhibitor PUT HTTP request
router.put("/exhibitor", async (req, res) =>
{
  //Define incoming data
  const request_data = req.body.exhibitors;

  try
  {
    //Read file
    let exhibitor_data = await fs.promises.readFile(exhibitor_path, "utf-8");

    exhibitor_data = decrypt(exhibitor_data); //Decrypt data

    //Define data
    let exhibitors = exhibitor_data?.exhibitors;
    let exhibitor_found = false;

    if(exhibitors)
    { 
      for(let r = 0; r < request_data.length; r++) //Loop through request_data
      {
        for(let i = 0; i < exhibitors.length; i++) //Loop through exhibitors
        {
          //If record matches incoming data
          if(Number(exhibitors[i].id) === Number(request_data[r].id)) 
          {
            exhibitor_found = true;

            //Array of key from request_data
            Object.values(request_data[r]).forEach((request_key, index) =>
            {
              //If key value is empty, keep original value
              if(String(request_key) !== "")
              {
                key = Object.keys(exhibitors[i])[index];

                exhibitors[i][key] = Number(request_key)? Number(request_key) : String(request_key) !== "[object Object]" ? String(request_key) : request_key; 
              };
            })

            //Lock file
            await lockfile.lock(exhibitor_path, {retries: { retires: 5 } });

            try
            {
              //Write file
              await fs.promises.writeFile(exhibitor_path, encrypt({exhibitors})) //Encrypt data
            }
            finally
            {
              try
              {
                //Unlock file
                await lockfile.unlock(exhibitor_path);        
              }
              catch(err)
              {
                console.error("Unlock failed")
              };
            };
          };
        };
        //Throw error if file not found
        if(!exhibitor_found)
        {
          let err = new Error("Data not found");
          err.code = "ENOENT";
          throw err;
        };
      };
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

//Exhibitor DELETE HTTP request
router.delete("/exhibitor/:id", async (req, res) =>
{
  //Define incoming data
  const request_id = req.params.id;

  try
  {
    //Read file
    let exhibitor_data = await fs.promises.readFile(exhibitor_path, "utf-8");

    exhibitor_data = decrypt(exhibitor_data); //Decrypt data

    //Define data
    let exhibitors = exhibitor_data?.exhibitors;
    let exhibitor_found = false;

    if(exhibitors)
    {        
      for(let i = 0; i < exhibitors.length; i++) //Loop through exhibitors
      {
        //If record matches incoming data
        if(Number(exhibitors[i].id) === Number(request_id)) 
        {
          exhibitor_found = true;

          exhibitors.splice(i, 1);

          //Lock file
          await lockfile.lock(exhibitor_path, {retries: { retires: 5 } });

          try
          {
            //Write file
            await fs.promises.writeFile(exhibitor_path, encrypt({exhibitors})) //Encrypt data
          }
          finally
          {
            try
            {
              //Unlock file
              await lockfile.unlock(exhibitor_path);        
            }
            catch(err)
            {
              console.error("Unlock failed")
            };
          };
        };
      };
      //Throw error if file not found
      if(!exhibitor_found)
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

module.exports = router