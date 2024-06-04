require('dotenv').config(); // This should be at the top of your file

const express = require('express');
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const cors = require('cors');
const pg = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const DBURL = process.env.DATABASE_URL;
const JWTSECRET = process.env.JWT_SECRET;

// Apply middleware
app.use(cors({
  origin: 'https://localhost:4200'
}));

app.use(bodyParser.json());

// PostgreSQL connection setup
const pool = new pg.Pool({
  connectionString: DBURL, // Update with your details
  ssl: false
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN_STRING

  if (token == null) return res.sendStatus(401); // No token present

  jwt.verify(token, JWTSECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token

    req.user = user;
    next();
  });
}

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// Login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  console.log("hello1");
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE afm = $1', [username]);

    console.log("/api/login1: " + result.rows.length);
    console.log("/api/login2");
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("/api/login3");
      // Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // Generate JWT
        const token = jwt.sign({ id: user.id }, JWTSECRET, { expiresIn: '1h' });
        res.json({ message: "Logged in successfully!", token });
      } else {
        res.status(400).json({ message: "Invalid credentials!" });
      }
    } else {
      res.status(404).json({ message: "User not found!" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/*app.post('/api/login', async (req, res) => {
  return res.json({ message: "Static login route hit successfully!" });
});*/

// Endpoint to get user information
app.get('/api/user', authenticateToken, async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE afm = $1', [username]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const { user_id, password, created_at, ...userWithoutSensitiveInfo } = user;  // Destructure to omit the password field

      res.json(userWithoutSensitiveInfo);
    } else {
      res.status(404).json({ message: "User not found" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});





app.get('/api/claims/', authenticateToken, async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT
        c.*,
        u.afm as afm,
        t.publication_title as publication_title,
        ct.type as claim_type,
        cp.periodicity as claim_periodicity
      FROM claims c
      LEFT JOIN users u ON c.user_id = u.user_id
      LEFT JOIN claims_publication_titles t ON c.publication_title_id = t.id
      LEFT JOIN claims_types ct ON c.type_id = ct.id
      LEFT JOIN claims_periodicity cp ON c.periodicity_id = cp.id
      WHERE u.afm = $1
    `, [username]);

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: "No claims found for the specified username" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Endpoint to get claims article titles
app.get('/api/claims/publicationTitles', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM claims_publication_titles');

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: "No claims publication titles found" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to get claims types
app.get('/api/claims/types', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM claims_types');

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: "No claims types found" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to get claims periodicity
app.get('/api/claims/periodicity', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM claims_periodicity');

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: "No claims periodicity found" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});








// HTTPS server options
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// Start HTTPS server
https.createServer(options, app).listen(3000, () => {
  console.log('HTTPS server running on https://localhost:3000');
});
