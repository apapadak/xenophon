require('dotenv').config(); // This should be at the top of your file

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const https = require('https');
const cors = require('cors');
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const DBURL = process.env.DATABASE_URL;
const JWTSECRET = process.env.JWT_SECRET;
const DNS_SITE = process.env.DNS_SITE;

const disableWordCountRoleIds = [4, 5, 6, 7, 8, 10, 11];

const corsOptions = {
  origin: process.env.DNS_SITE,
  credentials: true
};

app.use(cors(corsOptions));
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
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log("/api/login2");
      // Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // Generate JWT
        const token = jwt.sign({ id: user.id }, JWTSECRET, { expiresIn: '1h' });
        res.cookie('jwt', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'local', // Ensure secure is true in production
          sameSite: 'Strict',
          maxAge: 3600000 // 1 hour
        });
        res.json({ message: "Logged in successfully!" });
      } else {
        res.status(400).json({ message: "Invalid credentials!" });
      }
    } else {
      res.status(400).json({ message: "User not found!" });
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





app.get('/api/claims/paper', authenticateToken, async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const result = await pool.query(
      `SELECT
        c.id AS claimId,
        c.signature,
        COALESCE(pt.id, pte.id) AS titlepaper_id,
        COALESCE(pt.title, pte.title_extra) AS titlepaper_title,
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
      FROM claims_paper c
      LEFT JOIN claims_titles_papers pt ON c.title_paper_id = pt.id
      LEFT JOIN claims_titles_papers_extra pte ON c.title_paper_id_extra = pte.id
      LEFT JOIN claims_types t ON c.type_id = t.id
      LEFT JOIN claims_periodicities p ON c.periodicity_id = p.id
      LEFT JOIN claims_roles r ON c.role_id = r.id
      LEFT JOIN claims_wordcounts wc ON c.wordcount_id = wc.id
      LEFT JOIN claims_circulations cl ON c.circulation_id = cl.id
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
      titlePaper: {
        id: row.titlepaper_id,
        title: row.titlepaper_title,
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
      wordcount: row.wordcount_id ? {
        id: row.wordcount_id,
        wordcount: row.wordcount
      } : null,
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

app.get('/api/claims/internet', authenticateToken, async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const result = await pool.query(
      `SELECT
        c.id AS claimId,
        c.signature,
        COALESCE(pt.id, pte.id) AS titleinternet_id,
        COALESCE(pt.title, pte.title_extra) AS titleinternet_title,
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
      FROM claims_internet c
      LEFT JOIN claims_titles_internet pt ON c.title_internet_id = pt.id
      LEFT JOIN claims_titles_internet_extra pte ON c.title_internet_id_extra = pte.id
      LEFT JOIN claims_types t ON c.type_id = t.id
      LEFT JOIN claims_periodicities p ON c.periodicity_id = p.id
      LEFT JOIN claims_roles r ON c.role_id = r.id
      LEFT JOIN claims_wordcounts wc ON c.wordcount_id = wc.id
      LEFT JOIN claims_circulations cl ON c.circulation_id = cl.id
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
      titleInternet: {
        id: row.titleinternet_id,
        title: row.titleinternet_title,
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
      wordcount: row.wordcount_id ? {
        id: row.wordcount_id,
        wordcount: row.wordcount
      } : null,
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




app.post('/api/claims/paper/saveClaims', async (req, res) => {
  const { userId, claims, permFlag } = req.body;

  console.log('Received userId:', userId);
  console.log('Received claims:', JSON.stringify(claims, null, 2));
  console.log('Received permFlag:', permFlag);

  try {
    await pool.query('BEGIN');

    // Fetch all existing claims for the user
    const existingClaimsResult = await pool.query(
      'SELECT id FROM claims_paper WHERE user_id = $1',
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
        'DELETE FROM claims_paper WHERE id = ANY($1::int[])',
        [claimsToDelete]
      );
    }

    for (const claim of claims) {
      const {
        claimId,
        titlePaper,
        signature,
        type,
        periodicity,
        role,
        wordcount,
        circulation
      } = claim;

      let title_paper_id = null;
      let title_paper_id_extra = null;

      if (titlePaper.custom) {
        if (titlePaper.id === -1) {
          const result = await pool.query(
            'INSERT INTO claims_titles_papers_extra (title_extra) VALUES ($1) RETURNING id',
            [titlePaper.title]
          );
          title_paper_id_extra = result.rows[0].id;
        } else {
          title_paper_id_extra = titlePaper.id;
        }
      } else {
        title_paper_id = titlePaper.id;
      }

      const wordcountId = disableWordCountRoleIds.includes(role.id) ? null : wordcount.id;

      if (claimId === -1) {
        await pool.query(
          `INSERT INTO claims_paper (
            user_id, signature, title_paper_id, title_paper_id_extra,
            type_id, periodicity_id, role_id, wordcount_id, circulation_id, permFlag
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            userId, signature, title_paper_id, title_paper_id_extra,
            type.id, periodicity.id, role.id, wordcountId, circulation.id, permFlag
          ]
        );
      } else {
        await pool.query(
          `UPDATE claims_paper SET
            user_id = $1, signature = $2, title_paper_id = $3,
            title_paper_id_extra = $4, type_id = $5, periodicity_id = $6,
            role_id = $7, wordcount_id = $8, circulation_id = $9, permFlag = $10
          WHERE id = $11`,
          [
            userId, signature, title_paper_id, title_paper_id_extra,
            type.id, periodicity.id, role.id, wordcountId, circulation.id, permFlag, claimId
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

app.post('/api/claims/internet/saveClaims', async (req, res) => {
  const { userId, claims, permFlag } = req.body;

  console.log('Received userId:', userId);
  console.log('Received claims:', JSON.stringify(claims, null, 2));
  console.log('Received permFlag:', permFlag);

  try {
    await pool.query('BEGIN');

    // Fetch all existing claims for the user
    const existingClaimsResult = await pool.query(
      'SELECT id FROM claims_internet WHERE user_id = $1',
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
        'DELETE FROM claims_internet WHERE id = ANY($1::int[])',
        [claimsToDelete]
      );
    }

    for (const claim of claims) {
      const {
        claimId,
        titleInternet,
        signature,
        type,
        periodicity,
        role,
        wordcount,
        circulation
      } = claim;

      let title_internet_id = null;
      let title_internet_id_extra = null;

      if (titleInternet.custom) {
        if (titleInternet.id === -1) {
          const result = await pool.query(
            'INSERT INTO claims_titles_internet_extra (title_extra) VALUES ($1) RETURNING id',
            [titleInternet.title]
          );
          title_internet_id_extra = result.rows[0].id;
        } else {
          title_internet_id_extra = titleInternet.id;
        }
      } else {
        title_internet_id = titleInternet.id;
      }

      const wordcountId = disableWordCountRoleIds.includes(role.id) ? null : wordcount.id;

      if (claimId === -1) {
        await pool.query(
          `INSERT INTO claims_internet (
            user_id, signature, title_internet_id, title_internet_id_extra,
            type_id, periodicity_id, role_id, wordcount_id, circulation_id, permFlag
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            userId, signature, title_internet_id, title_internet_id_extra,
            type.id, periodicity.id, role.id, wordcountId, circulation.id, permFlag
          ]
        );
      } else {
        await pool.query(
          `UPDATE claims_internet SET
            user_id = $1, signature = $2, title_internet_id = $3,
            title_internet_id_extra = $4, type_id = $5, periodicity_id = $6,
            role_id = $7, wordcount_id = $8, circulation_id = $9, permFlag = $10
          WHERE id = $11`,
          [
            userId, signature, title_internet_id, title_internet_id_extra,
            type.id, periodicity.id, role.id, wordcountId, circulation.id, permFlag, claimId
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



app.get('/api/claims/paper/titlePapers', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM claims_titles_papers');
    res.json({
      titlePapers: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

app.get('/api/claims/internet/titleInternet', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM claims_titles_internet');
    res.json({
      titleInternet: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

app.get('/api/claims/dropdownData', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const typesResult = await client.query('SELECT * FROM claims_types');
    const periodicitiesResult = await client.query('SELECT * FROM claims_periodicities');
    const rolesResult = await client.query('SELECT * FROM claims_roles');
    const wordcountsResult = await client.query('SELECT * FROM claims_wordcounts');
    const circulationsResult = await client.query('SELECT * FROM claims_circulations');

    // Add disableWordCount flag to each role
    const roles = rolesResult.rows.map(role => ({
      ...role,
      disableWordCount: disableWordCountRoleIds.includes(role.id)
    }));

    res.json({
      types: typesResult.rows,
      periodicities: periodicitiesResult.rows,
      roles: roles,
      wordcounts: wordcountsResult.rows,
      circulations: circulationsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});





// HTTP server options
/*app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});*/


// HTTPS server options
const options = {
  key: fs.readFileSync(process.env.NODE_ENV === 'production' ? './ssl/backend.key' : './ssl/key.pem' ),
  cert: fs.readFileSync(process.env.NODE_ENV === 'production' ? './ssl/backend.crt' : './ssl/cert.pem' )
};

// Start HTTPS server
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server running on https://localhost:${PORT}`);
});
