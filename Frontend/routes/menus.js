const express = require('express');
const { parseISO, isValid } = require('date-fns');
const axios = require('axios');
const { parse } = require('dotenv');
require('dotenv').config();

const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      
      // Determine the requested date
      const currentDate = new Date().toISOString().split('T')[0]; // Get the current date
      const requestedDate = req.query.date || currentDate; // Use the current date if not specified in query
      if (!isValid(parseISO(requestedDate))) {
        return res.status(400).send('Invalid date format');
      }
      const requestedDateObject = new Date(requestedDate);
      const minDate = new Date('2000-01-01'); // Example minimum date
      const maxDate = new Date('2100-12-31'); // Example maximum date
      if (requestedDateObject < minDate || requestedDateObject > maxDate) {
        return res.status(400).send('Date out of range');
      }
      let previousDate = new Date(requestedDate);
      let nextDate =  new Date(requestedDate);
      // Calculate the previous day
      previousDate = new Date(previousDate.setDate(previousDate.getDate() - 1)).toISOString().split('T')[0];
      // Calculate the next day
      nextDate = new Date(nextDate.setDate(nextDate.getDate() + 1)).toISOString().split('T')[0];

      // Fetch all the menus from the API (this could be paginated in your actual implementation)
      const response = await axios.get(`${process.env.SERVER}/api/menus/bydate/${requestedDate}`);
      const menusData = response.data[0];

      //function for checking the next and previous dates
      async function checkDate(date){
          try{
          const reponse = await axios.get(`${process.env.SERVER}/api/menus/bydate/${date}`);
          return true;
        }
        catch(error){
          //console.error(error);
          return false
        }
      }
      //check previous and next day exists
      const previousreponse = await checkDate(previousDate)
      const nextreponse = await checkDate(nextDate)

  
      // Construct pagination URLs
      const baseUrl = `/menus?date=${requestedDate}`;
      const prevUrl = previousreponse !== false ? `/menus?date=${previousDate}` : null;
      const nextUrl = nextreponse !== false ? `/menus?date=${nextDate}` : null;
  
      // Render the template with the fetched menu for the requested date and the array of unique dates
      res.render('menus/view', {
        menus: menusData,
        currentdate: requestedDateObject.toDateString(),
        currentUrl: baseUrl,
        prevUrl: prevUrl,
        nextUrl: nextUrl,
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while fetching menus.');
    }
  });
  
  router.post('/sub', async(req,res)=> {
    console.log(req.body)

    const itemjson = JSON.parse(req.body.item)

    const previousid = parseInt(req.body.PreviousID);
    const newquantity = parseInt(req.body.quantity);
    const newid = parseInt(itemjson.id);
    const newname = itemjson.name;
    const mealdate = req.body.MDate.split('T')[0];
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(mealdate)) {
      return res.status(400).send('Invalid date format');
    }
    const parsedDate = Date.parse(mealdate);
    if (isNaN(parsedDate)) {
      return res.status(400).send('Invalid date format');
    }
    const currentDate = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
    if (parsedDate < oneYearAgo || parsedDate > currentDate) {
      return res.status(400).send('Date out of range');
    }
    const mealtype = req.body.MType; 
    const mealurl = `${process.env.SERVER}/api/menus/bydate/${mealdate}`;

    const menuResponse = await axios.get(mealurl);
    try{
      const menus = menuResponse.data[0];
      let itemToUpdate = menus[mealtype].items.find(item => item.id === previousid);
      
      itemToUpdate.id = newid
      itemToUpdate.name = newname
      itemToUpdate.quantity = newquantity

      // Post the updated menu back to the server via the API
      let updatemenu = await axios.put(`${process.env.SERVER}/api/menus/${menus._id}`, menus);
      console.log(menus)

    } catch (error) {
    // Error communicating with the backend API
    res.status(500).json({ message: 'Error communicating with backend API', error });
    }

    res.redirect('/menus?date=' + mealdate);
  })

  router.get('/sub', async(req, res) => {
    
    const itemId = req.query.itemId;
    const itemName = req.query.itemName;
    const quantity = req.query.quantity;
    const currentDate = req.query.currentDate;
    const mealType = req.query.mealType;


    const items = await axios.get(`${process.env.SERVER}/api/items`);
    console.log(items.data.rows)

    res.render('menus/sub', {
      items: items.data.rows,
      previousitem: {
        itemId: itemId,
        name: itemName,
        quantity: quantity,
        currentDate: currentDate,
        mealType: mealType
       }
    });
  });
  

module.exports = router;