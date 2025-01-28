const express = require('express')
const router = express.Router()

router.get('/', (req, res) => 
{
  res.render("experiences")
  res.end()
})

module.exports = router