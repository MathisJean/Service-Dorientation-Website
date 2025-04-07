
//Set up libraries
const fs = require('fs');
const path = require('path');

const lockfile = require('proper-lockfile');

const express = require('express')
const router = express.Router()

const handle_api_error = require("../lib/error_handler.js");
const email_authentication = require("../lib/email_authentication.js");

//Setup Router
router.get('/', (req, res) => 
{
  res.render("accueil")
  res.end()
})

//----Handle HTTP requests----//

let orienter_path = "database/orienteurs_data.json" //Path to data file
let account_path = "database/compte_data.json" //Path to account data file

//---Orienter---//

//Orienter Get HTTP request
router.get("/orienter", async (req, res) =>
{
  try
  {
    //Read file
    const orienter_data = await fs.promises.readFile(orienter_path);


    //Define data
    let orienters = JSON.parse(orienter_data)?.orienters;

    //Return response
    return res.send(orienters) 
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});
  
//Orienter Post HTTP request
router.post("/orienter", async (req, res) =>
{
  //Define incoming data
  const request_data = req.body.orienters[0];
  
  try
  {
    //Read file
    const orienter_data = await fs.promises.readFile(orienter_path);

    //Define data
    let orienters = JSON.parse(orienter_data)?.orienters;

    let last_orienter

    //Increment id from last record
    if(orienters.length > 0)
    {
      last_orienter = orienters.slice(-1)[0];      
    }
    else
    {
      last_orienter = {id: 0}
    };

    request_data.id = Number(last_orienter.id) + 1

    //Add new record to orienters
    orienters.push((request_data))

    //Lock file
    await lockfile.lock(orienter_path, {retries: { retires: 5 } });

    try
    {
      //Write file
      await fs.promises.writeFile(orienter_path, JSON.stringify({orienters}, null, 2))
    }
    finally
    {
      try
      {
        //Unlock file
        await lockfile.unlock(orienter_path);        
      }
      catch(err)
      {
        console.error("Unlock failed")
      };
    };
    //Return response
    return res.send(orienters)
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res);
  }
});
  
//Orienter Put HTTP request
router.put("/orienter", async (req, res) =>
{
  //Define incoming data
  const request_data = req.body.orienters[0];

  try
  {
    //Read file
    const orienter_data = await fs.promises.readFile(orienter_path);

    //Define data
    let orienters = JSON.parse(orienter_data)?.orienters;
    let orienter_found = false;

    if(orienters)
    {        
      for(let i = 0; i < orienters.length; i++) //Loop through orienters
      {
        //If record matches incoming data
        if(Number(orienters[i].id) === Number(request_data.id)) 
        {
          orienter_found = true;

          //Array of key from request_data
          Object.values(request_data).forEach((request_key, index) =>
          {
            //Clear img values
            if(String(request_key) === "/clear/")
            {
              key = Object.keys(orienters[i])[index];

              orienters[i][key] = "" 
            }
            //If key value is empty, keep original value
            else if(String(request_key) !== "")
            {
              key = Object.keys(orienters[i])[index];

              orienters[i][key] = Number(request_key)? Number(request_key) : String(request_key); 
            };
          })

          //Lock file
          await lockfile.lock(orienter_path, {retries: { retires: 5 } });

          try
          {
            //Write file
            await fs.promises.writeFile(orienter_path, JSON.stringify({orienters}, null, 2))
          }
          finally
          {
            try
            {
              //Unlock file
              await lockfile.unlock(orienter_path);        
            }
            catch(err)
            {
              console.error("Unlock failed")
            };
          };
        };
      };
      //Throw error if file not found
      if(!orienter_found)
      {
        let err = new Error("Data not found");
        err.code = "ENOENT";
        throw err;
      }
    };
    //Return response
    return res.send(orienters) 
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});
  
//Orienter Delete HTTP request
router.delete("/orienter/:id", async (req, res) =>
{
  //Define incoming data
  const request_id = req.params.id;

  try
  {
    //Read file
    const orienter_data = await fs.promises.readFile(orienter_path);

    //Define data
    let orienters = JSON.parse(orienter_data)?.orienters;
    let orienter_found = false;

    if(orienters)
    {        
      for(let i = 0; i < orienters.length; i++) //Loop through orienters
      {
        //If record matches incoming data
        if(Number(orienters[i].id) === Number(request_id)) 
        {
          orienter_found = true;

          orienters.splice(i, 1);

          //Lock file
          await lockfile.lock(orienter_path, {retries: { retires: 5 } });

          try
          {
            //Write file
            await fs.promises.writeFile(orienter_path, JSON.stringify({orienters}, null, 2))
          }
          finally
          {
            try
            {
              //Unlock file
              await lockfile.unlock(orienter_path);        
            }
            catch(err)
            {
              console.error("Unlock failed")
            };
          };
        };
      };
      //Throw error if file not found
      if(!orienter_found)
      {
        let err = new Error("Data not found");
        err.code = "ENOENT";
        throw err;
      }
    };
    //Return response
    return res.send(orienters) 
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res)
  };
});

//---Account---//

let account_request;
let authentication_code = "";

//Account login Post HTTP request
router.post("/account/login", async (req, res) => 
{
  //Define incoming data
  const account_request = req.body;
  const user_email = account_request?.email;
  const user_password = account_request?.password;

  try
  {
    //Read files
    const account_data = await fs.promises.readFile(account_path, "utf-8"); 

    let accounts = JSON.parse(account_data)?.accounts;

    //Compare incoming acount data to records
    const found_account = accounts.find((account) => account.email === user_email && account.password === user_password);

    if(found_account)
    {
      //Return response
      return res.send(found_account);
    }
    else
    {
      //Throw error if file not found
      let err = new Error("Account not found");

      //Custom error code for account not found
      err.code = "ACCNF";
      throw err; 
    };
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res);
  }
});

//Account signup authentication Post HTTP request
router.post("/account/signup/authentication", async (req, res) => 
{
  //Define incoming data
  account_request = req.body;
  const user_email = account_request?.email;

  try
  {
    //Check if the file exists, if not, create it with default content
    if(!fs.existsSync(account_path)) 
    {
      await fs.promises.writeFile(account_path, JSON.stringify({accounts: []}, null, 2));
    };

    //Read files
    const account_data = await fs.promises.readFile(account_path, "utf-8"); 

    let accounts = JSON.parse(account_data)?.accounts;

    //Compare incoming acount data to records
    const found_account = accounts.find((account) => account.email === user_email);

    if(!found_account)
    {
      authentication_code = "";

      for(let i = 0; i <= 5; i++)
      {
        authentication_code += String(Math.round(Math.random() * 9))
      };

      //Send authentication email
      email_authentication(account_request, accounts[0], authentication_code)

      //Return response
      return res.send(authentication_code);
    }
    else
    {
      //Throw error if file found
      let err = new Error("Account found");

      //Custom error code for account found
      err.code = "ACCF";
      throw err; 
    };
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res);
  }
});

//Account signup completion Post HTTP request
router.post("/account/signup/complete", async (req, res) =>
{
  try
  {
    //Read files
    const account_data = await fs.promises.readFile(account_path, "utf-8"); 

    let accounts = JSON.parse(account_data)?.accounts;

    account_request.id = Number(accounts[accounts.length - 1].id) + 1;

    accounts.push(account_request)

    //Lock files  
    await lockfile.lock(account_path, { retries: { retries: 5 } });

    try
    {
      //Write file
      await fs.promises.writeFile(account_path, JSON.stringify({accounts}, null, 2))
    }
    finally
    {
      try 
      {
        await lockfile.unlock(account_path);
      }
      catch(err)
      {
        console.error("Unlock failed:", err);
      }
    };

    //Return response
    return res.send(account_request);
  }
  catch(err)
  {
    //Handles error based on code
    return handle_api_error(err, res);
  }
});

//Export router to server file
module.exports = router