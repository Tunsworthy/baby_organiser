const mongoose = require('mongoose');

// Function to connect to MongoDB with retry logic
async function connectMongoDB(uri, maxRetries = 5, delayInMilliseconds = 5000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}: Connecting to MongoDB...`);
            await mongoose.connect(uri, { });
            console.log('Successfully connected to MongoDB.');
            break; // Connection successful, exit loop
        } catch (error) {
            console.error(`Connection attempt ${attempt} failed:`, error.message);
            if (attempt < maxRetries) {
                console.log(`Retrying in ${delayInMilliseconds / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delayInMilliseconds));
            } else {
                console.error('All connection attempts failed. Exiting application.');
                throw error; // Rethrow the last error after all retries have failed
            }
        }
    }
}

module.exports = {
    connectMongoDB,
};
