// server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import CORS middleware

const app = express();
const PORT = 5000;

// Enable CORS for all routes
app.use(cors());

// Define an endpoint to fetch SerpAPI data
app.get('/serpapi', async (req, res) => {
  const { query } = req.query; // Extract the query parameter from the request

  try {
    // Make the request to SerpAPI
    const response = await axios.get(`https://serpapi.com/search.json?q=${query} hours&api_key=REPLACE_YOU_API_KEY`);
    // Send the response from SerpAPI back to the client
    res.json(response.data);
  } catch (error) {
    // If there's an error, send an error response back to the client
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});