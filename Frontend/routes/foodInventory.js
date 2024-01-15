const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

// GET Food Inventory page.
router.get('/', async function(req, res, next) {
  try {
    // Fetch the list of items from the provided API.
    const apiUrl = process.env.SERVER + '/api/items/';
    const response = await axios.get(apiUrl);
    // Render the foodInventory page with the data from the API.
    res.render('food_inventory/foodinventory', { 
      title: 'Food Inventory',
      items: response.data.rows
    });

  } catch (error) {
    console.error("Error fetching data from the API:", error);
    res.render('food_inventory/foodinventory', { 
      title: 'Food Inventory'
    });
  }
});

// POST to add a new item.
router.post('/api/items', async function(req, res, next) {
  try {
    // Construct the API URL from the .env file
    const apiUrl = `${process.env.SERVER}/api/items/`;
    // Send a POST request to the API with the form data
    await axios.post(apiUrl, req.body);
    res.redirect('/foodinventory');
  } catch (error) {
    console.error("Error adding new item:", error);
    res.status(500).send("Error adding new item");
  }
});

router.patch('/api/items/:id', async function(req, res, next) {
  const itemId = req.params.id;
  try {
    // Construct the API URL with the item ID obtained from the request params
    const apiUrl = `${process.env.SERVER}/api/items/${itemId}`;
    
    // Forward the incoming PATCH request body to the actual API
    const response = await axios.patch(apiUrl, req.body);

    // Send back the response from the actual API to the client.
    // This could include the updated item data, a success message, etc.
    res.send(response.data);
  } catch (error) {
    console.error("Error updating item:", error);
    // Respond with HTTP status code 500 (server error)
    // and send the error message
    res.status(500).send(error.message);
  }
});

router.delete('/api/items/:id', async function(req, res, next) {
  const itemId = req.params.id;
  try {
    // Construct the API URL with the item ID obtained from the request params
    const apiUrl = `${process.env.SERVER}/api/items/${itemId}`;

    // Send a DELETE request to the actual API
    const response = await axios.delete(apiUrl);

    // Send back the response from the actual API to the client.
    // This might be a success message or confirmation of deletion.
    res.send(response.data);
  } catch (error) {
    console.error("Error deleting item:", error);
    // Respond with HTTP status code 500 (server error)
    // and send the error message
    res.status(500).send(error.message);
  }
});


module.exports = router;
