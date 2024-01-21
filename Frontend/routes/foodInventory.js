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


router.post('/api/inventory/:id', async (req, res) => {
  console.log("in inventory post API")
  const itemId = parseInt(req.params.id);
  const requestedQuantity = req.body.quantity;
  const mealdate = req.body.date;
  const mealtype = req.body.mealType; // "Lunch" or "Dinner"
  console.log(typeof itemId)
  const mealurl = `${process.env.SERVER}/api/menus/bydate/${mealdate}`;
  const apiUrl = `${process.env.SERVER}/api/items/${itemId}`;

  try {
      // Fetch current quantity from the backend API
      const currentResponse = await axios.get(apiUrl);
      const currentQuantity = currentResponse.data.quantity;
      let updatedquantity = currentQuantity - requestedQuantity;
      console.log(updatedquantity)

      if (updatedquantity >= 0) {
          const updateResponse = await axios.patch(apiUrl, { quantity: updatedquantity });
          console.log(updateResponse.data)
          // Attempt to allocate the item to the menu
          try {
              console.log("in try")
              console.log(mealurl)
              const menuResponse = await axios.get(mealurl);
              console.log(menuResponse.data)
              const menus = menuResponse.data[0];
              //const menuToUpdate = menus.find(menu => menu.date === mealdate);
              //console.log(menuToUpdate)
              if (!menus) {
                  throw new Error('Menu not found.');
              }

              let itemToUpdate = menus[mealtype].items.find(item => item.id === itemId);
              
              console.log('menus:', menus);
              console.log('mealtype:', mealtype);
              console.log('mealtypejson:', menus[mealtype])
              console.log('itemId:', itemId);
              console.log('itemToUpdate:', itemToUpdate);
              
              if (!itemToUpdate) {
                  throw new Error(`Item not found in ${mealtype} menu.`);
              }

              // Update the allocated status of the item
              itemToUpdate.allocated = true;

              // Post the updated menu back to the server via the API
              let updatemenu = await axios.put(`${process.env.SERVER}/api/menus/${menus._id}`, menus);
              console.log(menus)
              // Respond with a success message
              res.json({ message: `Item ${itemToUpdate.name} QTY ${requestedQuantity} deducted from inventory` });
              
          } catch (menuError) {
              // If updating the menu failed after deducting the stock, send an allocation error
              res.json({ message: `Item ${currentResponse.data.name} QTY ${requestedQuantity} deducted from inventory - Unable to allocate item from menu` });
          }
      } else {
          // Inventory deduction is unsuccessful
          res.status(400).json({ message: 'Insufficient stock or invalid quantity' });
      }
  } catch (error) {
      // Error communicating with the backend API
      res.status(500).json({ message: 'Error communicating with backend API', error });
  }
});


module.exports = router;
