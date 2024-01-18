var express = require('express');
var router = express.Router();
const axios = require('axios');
require('dotenv').config();

const fetchAlerts = require('../functions/alerts');

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    const response = await fetchAlerts();
    //console.log(response)
    
    res.render('index', { 
      title: process.env.PROJECTNAME,
      alerts: response.alerts,
      alertTypes: response.alertTypes,
      icons: response.icons
  
    });
  }
  catch (error) {
    console.error(error);
    res.render('index', { 
      title: process.env.PROJECTNAME,
    });
  }
  
  
});

module.exports = router;
