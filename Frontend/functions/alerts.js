const axios = require('axios');
require('dotenv').config();

const fetchAlerts = async () => {
  try {
    const response = await axios.get(`${process.env.SERVER}/api/alerts/active`);
    //console.log(response.data);
    
    const alertTypes = {
      'Inventory': 'alert-danger',
      'Information': 'alert-primary'
    };
    
    const icons = {
      'Inventory': 'exclamation-triangle-fill',
      'Information': 'info-fill'
    };

    return {
      alerts: response.data,
      alertTypes: alertTypes,
      icons: icons
    };
  } catch (error) {
    console.error(error);
    throw new Error('Error fetching alerts');
  }
};

module.exports = fetchAlerts;
