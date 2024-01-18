const express = require('express');
const router = express.Router();
const axios = require('axios'); // Use axios for HTTP requests

// Update this with the correct server address from your .env file
const BACKEND_API_SERVER = process.env.SERVER + "/api/alerts/";

// Dismiss alert endpoint
router.patch('/dismiss-alert/:id', async (req, res) => {
  console.log('called')
    const alertId = req.params.id;

  try {
    // Send PATCH request to the backend API server to update the status
    const response = await axios.patch(`${BACKEND_API_SERVER}${alertId}`, {
        status: 'inactive'
    });
    console.log(response)
    // Handle success response
    res.status(200).json({ message: "Alert dismissed successfully", data: response.data });
  } catch (error) {
    // Handle errors
    res.status(error.response?.status || 500).json({ message: error.message });
  }
});

module.exports = router;
