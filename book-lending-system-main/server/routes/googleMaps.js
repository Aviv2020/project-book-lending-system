const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv').config({ path: './.env' });

const API_KEY = process.env.GOOGLE_MAPS_API;

router.get("/getAPIKey", (req, res) => {
    return res.json({key: API_KEY});
})


module.exports = router;
