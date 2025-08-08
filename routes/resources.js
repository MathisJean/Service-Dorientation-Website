
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
  res.render("resources")
  res.end()
})

//----Handle HTTP requests----//

let record_path = "database/resources_data.json" //Path to resource_data file
let link_path = "database/links_data.json" //Path to links_data file

//---record---//

//record Get HTTP request
router.get("/record", async (req, res) =>
{
  try
  {
    //Read file
    let record_data = await fs.promises.readFile(record_path);

    record_data = decrypt(record_data); //Decrypt data

    //Define data
    let records = record_data?.records;

    //Return response
    return res.send(http_encryption(JSON.stringify(records), get_client_public_key())) 
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});

//record Post HTTP request
router.post("/record", async (req, res) =>
{
  //Define incoming data
  const request_data = req.body.records[0];
  
  try
  {
    //Read file
    let record_data = await fs.promises.readFile(record_path);

    record_data = decrypt(record_data); //Decrypt data

    //Define data
    let records = record_data?.records;

    let last_record

    //Increment id from last record
    if(records.length > 0)
    {
      last_record = records.slice(-1)[0];      
    }
    else
    {
      last_record = {id: 0}
    };

    request_data.id = Number(last_record.id) + 1

    //Add new record to orienters
    records.push((request_data))

    //Lock file
    await lockfile.lock(record_path, {retries: { retires: 5 } });

    try
    {
      //Write file
      await fs.promises.writeFile(record_path, encrypt({records}), null, 2) //Encrypt data
    }
    finally
    {
      try
      {
        //Unlock file
        await lockfile.unlock(record_path);        
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

//record PUT HTTP request
router.put("/record", async (req, res) =>
{
  //Define incoming data
  const request_data = req.body.records;

  try
  {
    //Read file
    let record_data = await fs.promises.readFile(record_path, "utf-8");

    record_data = decrypt(record_data); //Decrypt data

    //Define data
    let records = record_data?.records;
    let record_found = false;

    if(records)
    { 
      for(let r = 0; r < request_data.length; r++) //Loop through request_data
      {
        for(let i = 0; i < records.length; i++) //Loop through records
        {
          //If record matches incoming data
          if(Number(records[i].id) === Number(request_data[r].id)) 
          {
            record_found = true;

            //Array of key from request_data
            Object.values(request_data[r]).forEach((request_key, index) =>
            {
              //If key value is empty, keep original value
              if(String(request_key) !== "")
              {
                key = Object.keys(records[i])[index];

                records[i][key] = Number(request_key)? Number(request_key) : String(request_key) !== "[object Object]" ? String(request_key) : request_key; 
              };
            })

            //Lock file
            await lockfile.lock(record_path, {retries: { retires: 5 } });

            try
            {
              //Write file
              await fs.promises.writeFile(record_path, encrypt({records})) //Encrypt data
            }
            finally
            {
              try
              {
                //Unlock file
                await lockfile.unlock(record_path);        
              }
              catch(err)
              {
                console.error("Unlock failed")
              };
            };
          };
        };
        //Throw error if file not found
        if(!record_found)
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

//record DELETE HTTP request
router.delete("/record/:id", async (req, res) =>
{
  //Define incoming data
  const request_id = req.params.id;

  try
  {
    //Read file
    let record_data = await fs.promises.readFile(record_path, "utf-8");

    record_data = decrypt(record_data); //Decrypt data

    //Define data
    let records = record_data?.records;
    let record_found = false;

    if(records)
    {        
      for(let i = 0; i < records.length; i++) //Loop through records
      {
        //If record matches incoming data
        if(Number(records[i].id) === Number(request_id)) 
        {
          record_found = true;

          records.splice(i, 1);

          //Lock file
          await lockfile.lock(record_path, {retries: { retires: 5 } });

          try
          {
            //Write file
            await fs.promises.writeFile(record_path, encrypt({records})) //Encrypt data
          }
          finally
          {
            try
            {
              //Unlock file
              await lockfile.unlock(record_path);        
            }
            catch(err)
            {
              console.error("Unlock failed")
            };
          };
        };
      };
      //Throw error if file not found
      if(!record_found)
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

router.put("/link", async (req, res) =>
{
  //Define incoming data
  const request_data = req.body.records;

  try
  {
    //Read file
    let record_data = await fs.promises.readFile(link_path, "utf-8");

    record_data = decrypt(record_data); //Decrypt data

    //Define data
    let records = record_data?.records;
    let record_found = false;

    if(records)
    { 
      for(let r = 0; r < request_data.length; r++) //Loop through request_data
      {
        for(let i = 0; i < records.length; i++) //Loop through records
        {
          //If record matches incoming data
          if(Number(records[i].id) === Number(request_data[r].id)) 
          {
            record_found = true;

            //Array of key from request_data
            Object.values(request_data[r]).forEach((request_key, index) =>
            {
              //If key value is empty, keep original value
              if(String(request_key) !== "")
              {
                key = Object.keys(records[i])[index];

                records[i][key] = Number(request_key)? Number(request_key) : String(request_key) !== "[object Object]" ? String(request_key) : request_key; 
              };
            })

            //Lock file
            await lockfile.lock(link_path, {retries: { retires: 5 } });

            try
            {
              //Write file
              await fs.promises.writeFile(link_path, encrypt({records})) //Encrypt data
            }
            finally
            {
              try
              {
                //Unlock file
                await lockfile.unlock(link_path);        
              }
              catch(err)
              {
                console.error("Unlock failed")
              };
            };
          };
        };
        //Throw error if file not found
        if(!record_found)
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
})

module.exports = router