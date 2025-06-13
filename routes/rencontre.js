
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
  res.render("rencontre")
  res.end()
})

module.exports = router