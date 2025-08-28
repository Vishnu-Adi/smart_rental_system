// anomalyService.js
const axios = require("axios");

const FLASK_API_URL = "http://localhost:8000/predict"; // Flask is running here

async function detectAnomaly(data, learn = false) {
  try {
    const response = await axios.post(
      `${FLASK_API_URL}?learn=${learn}`, 
      data,
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data; // { score: ..., is_anomaly: ... }
  } catch (error) {
    console.error("Error calling Flask anomaly API:", error.message);
    throw error;
  }
}

module.exports = { detectAnomaly };
