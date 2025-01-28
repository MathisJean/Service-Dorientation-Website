const express = require('express')
const router = express.Router()

router.get('/', (req, res) => 
{
  res.render("cours")
  res.end()
})

module.exports = router