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
const cookieParser = require('cookie-parser');

// Apply middleware
app.use(cors({
  origin: 'https://localhost:4200'
}));

app.use(bodyParser.json());

app.use(cookieParser());

// PostgreSQL connection setup
const pool = new pg.Pool({
  connectionString: DBURL, // Update with your details
  ssl: false
});

function authenticateToken(req, res, next) {
  const token = req.cookies.jwt;

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
        res.cookie('jwt', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Ensure secure is true in production
          sameSite: 'Strict',
          maxAge: 3600000 // 1 hour
        });
        res.json({ message: "Logged in successfully!" });
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

// Token validation route
app.get('/api/validateToken', authenticateToken, (req, res) => {
  res.status(200).json({ valid: true });
});

// Add this endpoint to handle logout
app.post('/api/logout', authenticateToken, (req, res) => {
  // Clear the cookie
  res.clearCookie('jwt', { httpOnly: true, secure: true, sameSite: 'strict' });
  res.json({ message: "Logged out successfully" });
});



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
      const { password, created_at, ...userWithoutSensitiveInfo } = user;  // Destructure to omit the password field

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
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const result = await pool.query(
      `SELECT
        c.id AS claimId,
        c.signature,
        COALESCE(pte.id, pt.id) AS publicationTitle_id,
        COALESCE(pte.publication_title, pt.publication_title) AS publicationTitle_publication_title,
        t.id AS type_id,
        t.type,
        p.id AS periodicity_id,
        p.periodicity,
        r.id AS role_id,
        r.role,
        wc.id AS wordcount_id,
        wc.wordcount,
        cl.id AS circulation_id,
        cl.circulation,
        c.permflag AS "permFlag",
        CASE WHEN pte.id IS NOT NULL THEN true ELSE false END AS custom
      FROM claims c
      LEFT JOIN claims_publication_titles pt ON c.publication_title_id = pt.id
      LEFT JOIN claims_publication_titles_extra pte ON c.publication_title_id_extra = pte.id
      LEFT JOIN claims_types t ON c.type_id = t.id
      LEFT JOIN claims_periodicity p ON c.periodicity_id = p.id
      LEFT JOIN claims_role r ON c.role_id = r.id
      LEFT JOIN claims_wordcount wc ON c.wordcount_id = wc.id
      LEFT JOIN claims_circulation cl ON c.circulation_id = cl.id
      WHERE c.user_id = $1
      ORDER BY c.id`, // Order by claimId
      [userId]
    );

    // Print each row line by line
    result.rows.forEach(row => {
      console.log('Row:', row);
    });

    const claims = result.rows.map(row => ({
      claimId: row.claimid,
      publicationTitle: {
        id: row.publicationtitle_id,
        publication_title: row.publicationtitle_publication_title,
        custom: row.custom
      },
      signature: row.signature,
      type: {
        id: row.type_id,
        type: row.type
      },
      periodicity: {
        id: row.periodicity_id,
        periodicity: row.periodicity
      },
      role: {
        id: row.role_id,
        role: row.role
      },
      wordcount: {
        id: row.wordcount_id,
        wordcount: row.wordcount
      },
      circulation: {
        id: row.circulation_id,
        circulation: row.circulation
      },
      permFlag: row.permFlag
    }));

    console.log('\n\nSuccess fetching claims: ', claims, '\n\n');
    res.status(200).json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).send('Error fetching claims');
  }
});

app.post('/api/claims/saveClaims', async (req, res) => {
  const { userId, claims, permFlag } = req.body;

  console.log('Received userId:', userId);
  console.log('Received claims:', JSON.stringify(claims, null, 2));
  console.log('Received permFlag:', permFlag);

  try {
    await pool.query('BEGIN');

    // Fetch all existing claims for the user
    const existingClaimsResult = await pool.query(
      'SELECT id FROM claims WHERE user_id = $1',
      [userId]
    );
    const existingClaims = existingClaimsResult.rows;

    // Identify claims to delete
    const existingClaimIds = existingClaims.map(claim => claim.id);
    const incomingClaimIds = claims.map(claim => claim.claimId);
    const claimsToDelete = existingClaimIds.filter(id => !incomingClaimIds.includes(id));

    // Delete the claims that are no longer present in the request
    if (claimsToDelete.length > 0) {
      await pool.query(
        'DELETE FROM claims WHERE id = ANY($1::int[])',
        [claimsToDelete]
      );
    }

    for (const claim of claims) {
      const {
        claimId,
        publicationTitle,
        signature,
        type,
        periodicity,
        role,
        wordcount,
        circulation
      } = claim;

      let publication_title_id = null;
      let publication_title_id_extra = null;

      if (publicationTitle.custom) {
        if (publicationTitle.id === -1) {
          const result = await pool.query(
            'INSERT INTO claims_publication_titles_extra (publication_title) VALUES ($1) RETURNING id',
            [publicationTitle.publication_title]
          );
          publication_title_id_extra = result.rows[0].id;
        } else {
          publication_title_id_extra = publicationTitle.id;
        }
      } else {
        publication_title_id = publicationTitle.id;
      }

      if (claimId === -1) {
        await pool.query(
          `INSERT INTO claims (
            user_id, signature, publication_title_id, publication_title_id_extra,
            type_id, periodicity_id, role_id, wordcount_id, circulation_id, permFlag
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            userId, signature, publication_title_id, publication_title_id_extra,
            type.id, periodicity.id, role.id, wordcount.id, circulation.id, permFlag
          ]
        );
      } else {
        await pool.query(
          `UPDATE claims SET
            user_id = $1, signature = $2, publication_title_id = $3,
            publication_title_id_extra = $4, type_id = $5, periodicity_id = $6,
            role_id = $7, wordcount_id = $8, circulation_id = $9, permFlag = $10
          WHERE id = $11`,
          [
            userId, signature, publication_title_id, publication_title_id_extra,
            type.id, periodicity.id, role.id, wordcount.id, circulation.id, permFlag, claimId
          ]
        );
      }
    }

    await pool.query('COMMIT');
    res.status(200).json({ message: 'Claims saved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error saving claims:', error);
    res.status(500).send('Error saving claims');
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
app.get('/api/claims/periodicities', authenticateToken, async (req, res) => {
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

// Endpoint to get claims roles
app.get('/api/claims/roles', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM claims_role');

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: "No claims roles found" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to get claims wordcounts
app.get('/api/claims/wordcounts', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM claims_wordcount');

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: "No claims wordcounts found" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to get claims circulations
app.get('/api/claims/circulations', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM claims_circulation');

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ message: "No claims circulations found" });
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
