const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

router.get('/', async (req, res) => {
    try {
      // Fetch all the menus from the API (this could be paginated in your actual implementation)
      const response = await axios.get(`${process.env.SERVER}/api/menus`);
      const menusData = response.data;
  
      // Extract unique dates from the menus
      const uniqueDates = [...new Set(menusData.map(menu => menu.date))].sort();
  
      // Determine the requested date
      const requestedDate = req.query.date || uniqueDates[0]; // Defaults to the first date if not specified
      const currentIndex = uniqueDates.indexOf(requestedDate);
    
      // Get next and previous date indices for pagination
      const previousIndex = currentIndex > 0 ? currentIndex - 1 : null;
      const nextIndex = currentIndex < uniqueDates.length - 1 ? currentIndex + 1 : null;
    
      // Construct pagination URLs
      const baseUrl = '/menus?date=';
      const prevUrl = previousIndex !== null ? `${baseUrl}${uniqueDates[previousIndex]}` : null;
      const nextUrl = nextIndex !== null ? `${baseUrl}${uniqueDates[nextIndex]}` : null;

      // Find the menu for the requested date
      const menus = menusData.find(menu => menu.date === requestedDate);
  
      // Render the template with the fetched menu for the requested date and the array of unique dates
          // Render the template with the appropriate data
    res.render('menus/view', {
        menus: menus,
        dates: uniqueDates,
        currentIndex: currentIndex,
        prevUrl: prevUrl,
        nextUrl: nextUrl,
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while fetching menus.');
    }
  });
  




module.exports = router;