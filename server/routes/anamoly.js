// server/routes/anomaly.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

// Call your Flask API from Node.js
router.post("/detect", async (req, res) => {
  try {
    const flaskResponse = await axios.post("http://127.0.0.1:8000/predict", req.body, {
      params: { learn: req.query.learn || false }
    });
    res.json(flaskResponse.data);
  } catch (err) {
    console.error("Error calling Flask API:", err.message);
    res.status(500).json({ error: "Anomaly detection failed" });
  }
});

module.exports = router;
