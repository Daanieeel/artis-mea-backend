const express = require('express');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const dbHelpers = require('./dbHelpers');

require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);
app.use(express.json());

const cors = require('cors');
app.use(cors());

app.patch('/redeem-token', async (req, res) => {
  try {
    const { name, token } = req.body;

    console.debug('New request: ', req.body);

    const requiredFields = ['name', 'token'];
    const missingFields = validateFields(req.body, requiredFields);
    if (missingFields.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        missingFields: missingFields
      });
      return;
    }

    const connection = await mysql.createConnection(dbConfig);

    // Check if the token is valid and unused
    const tokenId = await dbHelpers.getValidUnusedToken(connection, token);
    if (!tokenId) {
      res.status(400).json({ type: 1, error: 'Invalid or used token' });
      return;
    }

    // Check if the player is already whitelisted
    const isWhitelisted = await dbHelpers.isPlayerWhitelisted(connection, name);
    if (isWhitelisted || true) {
      res.status(400).json({ type: 2, error: 'Player is already whitelisted' });
      return;
    }

    // Add the player to the whitelist
    await dbHelpers.addPlayerToWhitelist(connection, tokenId, name);

    res.send({
      success: true,
      token: token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});


const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function validateFields(body, requiredFields) {
  const missingFields = [];
  for (let field of requiredFields) {
    if (!body || !body[field]) {
      missingFields.push(field);
    }
  }
  return missingFields;
}