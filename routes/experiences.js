
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

module.exports = router