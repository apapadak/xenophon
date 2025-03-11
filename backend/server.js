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

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DBURL = process.env.DATABASE_URL;
const JWTSECRET = process.env.JWT_SECRET;
const DNS_SITE = process.env.DNS_SITE;

const distributionMapping = {
      '2023': 'archive_2023',
      '2024': 'archive_2024'
};

const disableWordCountRoleIds = [1, 3, 4, 5, 6, 8, 9];
const disablePeriodicitiesIdsForTvsRadios = [5, 6, 7, 8];

const saltRounds = 10;

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

  //console.log("hello1");
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE afm = $1', [username]);

    //console.log("/api/login1: " + result.rows.length);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      //console.log("/api/login2");
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

        console.log(`[${new Date().toISOString()}] [LOGIN EVENT] : user_id: ${user.user_id}, afm: ${user.afm}, mhtrwo: ${user.mhtrwo}`);

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

  /*if ( username !== 'zscooter' ) {
    return res.status(401).json({ message: "Forbidden!" });
  }*/

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE afm = $1', [username]);



    if (result.rows.length > 0) {
      const user = result.rows[0];

      const { password, created_at, dob, ...userWithoutSensitiveInfo } = user;  // Destructure to omit the password field

      // Format the dob to dd-mm-yyyy
      if (dob) {
        userWithoutSensitiveInfo.dob = formatToGRDate(dob);
      }

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

// Endpoint to persist user information
app.post('/api/user', authenticateToken, async (req, res) => {
  const user = req.body;

  if (!user || !user.afm || !user.mhtrwo) {
    return res.status(400).json({ message: "User data, AFM, and Mhtrwo are required" });
  }

  try {
    const client = await pool.connect();

    const passwordString = user.mhtrwo.toString().replace(/^\n+|\n+$/g, '').trim();
    const hashedPassword = await bcrypt.hash(passwordString, saltRounds);

    const formattedDob = user.dob ? formatToPostgresDate(user.dob) : null;

    if (user.user_id === -1) {
      // Check if a user with the provided AFM already exists
      const checkAfmQuery = 'SELECT * FROM users WHERE afm = $1';
      const checkAfmResult = await client.query(checkAfmQuery, [user.afm]);

      if (checkAfmResult.rows.length > 0) {
        client.release();
        return res.status(409).json({ message: "User with this AFM already exists" });
      }

      // Check if a user with the provided Mhtrwo already exists
      const checkMhtrwoQuery = 'SELECT * FROM users WHERE mhtrwo = $1';
      const checkMhtrwoResult = await client.query(checkMhtrwoQuery, [user.mhtrwo]);

      if (checkMhtrwoResult.rows.length > 0) {
        client.release();
        return res.status(410).json({ message: "User with this Mhtrwo already exists" });
      }

      const insertQuery = `
        INSERT INTO users (afm, mhtrwo, password, firstname, surname, father_name, tax_office, dob, adt, iban, bank, legal_form, address, city, postal_code, country, telephone, mobile, email_1, email_2, created_at, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP, $21)
        RETURNING user_id`;
      const values = [
        user.afm, user.mhtrwo, hashedPassword, user.firstname, user.surname, user.father_name, user.tax_office, formattedDob, user.adt, user.iban, user.bank, user.legal_form, user.address, user.city, user.postal_code, user.country, user.telephone, user.mobile, user.email_1, user.email_2, user.notes
      ];
      const result = await client.query(insertQuery, values);
      user.user_id = result.rows[0].user_id; // Get the new user_id
      res.status(201).json({ message: "User created successfully", user_id: user.user_id });
    } else {
      // Update existing user
      const updateQuery = `
        UPDATE users
        SET afm = $1, mhtrwo = $2, password = $3, firstname = $4, surname = $5, father_name = $6, tax_office = $7, dob = $8, adt = $9, iban = $10, bank = $11, legal_form = $12, address = $13, city = $14, postal_code = $15, country = $16, telephone = $17, mobile = $18, email_1 = $19, email_2 = $20, modified_at = CURRENT_TIMESTAMP, notes = $21
        WHERE user_id = $22`;
      const values = [
        user.afm, user.mhtrwo, hashedPassword, user.firstname, user.surname, user.father_name, user.tax_office, formattedDob, user.adt, user.iban, user.bank, user.legal_form, user.address, user.city, user.postal_code, user.country, user.telephone, user.mobile, user.email_1, user.email_2, user.notes, user.user_id
      ];
      await client.query(updateQuery, values);
      res.status(200).json({ message: "User updated successfully" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to get user information
app.get('/api/user/checkCredentials', authenticateToken, async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT admin FROM users WHERE afm = $1', [username]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isAdmin = user.admin;
      res.json({ isAdmin });
    } else {
      res.status(404).json({ message: "User not found" });
    }

    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});





app.get('/api/claims/:distributionYear?/paper', authenticateToken, async (req, res) => {
  const { userId } = req.query;
  const distributionYear = req.params.distributionYear;
  const schema = distributionYear ? (distributionMapping[distributionYear] || 'public') : 'public';

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
        t.id AS paper_type_id,
        t.type,
        p.id AS periodicity_id,
        p.periodicity,
        r.id AS role_id,
        r.role,
        wc.id AS wordcount_id,
        wc.wordcount,
        cl.id AS circulation_id,
        cl.circulation,
        c.finalflag AS "finalFlag",
        c.created_at AS created_at,
        c.updated_at AS updated_at,
        c.finalized_at AS finalized_at,
        CASE WHEN pte.id IS NOT NULL THEN true ELSE false END AS custom
      FROM "${schema}".claims_paper c
      LEFT JOIN "${schema}".claims_titles_papers pt ON c.title_paper_id = pt.id
      LEFT JOIN "${schema}".claims_titles_papers_extra pte ON c.title_paper_id_extra = pte.id
      LEFT JOIN "${schema}".claims_paper_types t ON c.paper_type_id = t.id
      LEFT JOIN "${schema}".claims_periodicities p ON c.periodicity_id = p.id
      LEFT JOIN "${schema}".claims_roles r ON c.role_id = r.id
      LEFT JOIN "${schema}".claims_wordcounts wc ON c.wordcount_id = wc.id
      LEFT JOIN "${schema}".claims_circulations cl ON c.circulation_id = cl.id
      WHERE c.user_id = $1
      ORDER BY c.id`, // Order by claimId
      [userId]
    );

    // Print each row line by line
    if ( process.env.NODE_ENV === 'local' ) {
      result.rows.forEach(row => {
        console.log('Row:', row);
      });
    }

    const claims = result.rows.map(row => ({
      claimId: row.claimid,
      titlePaper: {
        id: row.titlepaper_id,
        title: row.titlepaper_title,
        custom: row.custom
      },
      signature: row.signature,
      paperType: {
        id: row.paper_type_id,
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
      finalFlag: row.finalFlag,
      created_at : row.created_at,
      updated_at : row.updated_at,
      finalized_at : row.finalized_at
    }));

    if ( process.env.NODE_ENV === 'local' ) {
      console.log('\n\nSuccess fetching claims: ', claims, '\n\n');
    }
    res.status(200).json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).send('Error fetching claims');
  }
});

app.get('/api/claims/:distributionYear?/internet', authenticateToken, async (req, res) => {
  const { userId } = req.query;
  const distributionYear = req.params.distributionYear;
  const schema = distributionYear ? (distributionMapping[distributionYear] || 'public') : 'public';

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
        t.id AS internet_type_id,
        t.type,
        p.id AS periodicity_id,
        p.periodicity,
        r.id AS role_id,
        r.role,
        wc.id AS wordcount_id,
        wc.wordcount,
        pa.id AS pageviews_id,
        pa.pageviews,
        c.finalflag AS "finalFlag",
        c.created_at AS created_at,
        c.updated_at AS updated_at,
        c.finalized_at AS finalized_at,
        CASE WHEN pte.id IS NOT NULL THEN true ELSE false END AS custom
      FROM "${schema}".claims_internet c
      LEFT JOIN "${schema}".claims_titles_internet pt ON c.title_internet_id = pt.id
      LEFT JOIN "${schema}".claims_titles_internet_extra pte ON c.title_internet_id_extra = pte.id
      LEFT JOIN "${schema}".claims_internet_types t ON c.internet_type_id = t.id
      LEFT JOIN "${schema}".claims_periodicities p ON c.periodicity_id = p.id
      LEFT JOIN "${schema}".claims_roles r ON c.role_id = r.id
      LEFT JOIN "${schema}".claims_wordcounts wc ON c.wordcount_id = wc.id
      LEFT JOIN "${schema}".claims_pageviews pa ON c.pageviews_id = pa.id
      WHERE c.user_id = $1
      ORDER BY c.id`, // Order by claimId
      [userId]
    );

    // Print each row line by line
    if ( process.env.NODE_ENV === 'local' ) {
      result.rows.forEach(row => {
        console.log('Row:', row);
      });
    }

    const claims = result.rows.map(row => ({
      claimId: row.claimid,
      titleInternet: {
        id: row.titleinternet_id,
        title: row.titleinternet_title,
        custom: row.custom
      },
      signature: row.signature,
      internetType: {
        id: row.internet_type_id,
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
      pageviews: row.pageviews_id ? {
        id: row.pageviews_id,
        pageviews: row.pageviews
      } : null,
      //circulation: row.circulation,
      finalFlag: row.finalFlag,
      created_at : row.created_at,
      updated_at : row.updated_at,
      finalized_at : row.finalized_at
    }));

    if ( process.env.NODE_ENV === 'local' ) {
      console.log('\n\nSuccess fetching claims: ', claims, '\n\n');
    }
    res.status(200).json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).send('Error fetching claims');
  }
});

app.get('/api/claims/:distributionYear?/tv', authenticateToken, async (req, res) => {
  const { userId } = req.query;
  const distributionYear = req.params.distributionYear;
  const schema = distributionYear ? (distributionMapping[distributionYear] || 'public') : 'public';

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const result = await pool.query(
      `SELECT
        c.id AS claimId,
        c.signature,
        COALESCE(pt.id, pte.id) AS titletv_id,
        COALESCE(pt.title, pte.title_extra) AS titletv_title,
        t.id AS type_id,
        t.type,
        p.id AS periodicity_id,
        p.periodicity,
        r.id AS role_id,
        r.role,
        c.wordcount,
        c.circulation,
        c.finalflag AS "finalFlag",
        c.created_at AS created_at,
        c.updated_at AS updated_at,
        c.finalized_at AS finalized_at,
        CASE WHEN pte.id IS NOT NULL THEN true ELSE false END AS custom
      FROM "${schema}".claims_tv c
      LEFT JOIN "${schema}".claims_titles_tv pt ON c.title_tv_id = pt.id
      LEFT JOIN "${schema}".claims_titles_tv_extra pte ON c.title_tv_id_extra = pte.id
      LEFT JOIN "${schema}".claims_tv_types t ON c.tv_type_id = t.id
      LEFT JOIN "${schema}".claims_periodicities p ON c.periodicity_id = p.id
      LEFT JOIN "${schema}".claims_roles r ON c.role_id = r.id
      WHERE c.user_id = $1
      ORDER BY c.id`, // Order by claimId
      [userId]
    );
    //LEFT JOIN claims_wordcounts wc ON c.wordcount_id = wc.id
    //LEFT JOIN claims_circulations cl ON c.circulation_id = cl.id

    // Print each row line by line
    if ( process.env.NODE_ENV === 'local' ) {
      result.rows.forEach(row => {
        console.log('Row:', row);
      });
    }

    const claims = result.rows.map(row => ({
      claimId: row.claimid,
      titleTv: {
        id: row.titletv_id,
        title: row.titletv_title,
        custom: row.custom
      },
      signature: row.signature,
      tvType: {
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
      wordcount: null,
      circulation: null,
      finalFlag: row.finalFlag,
      created_at : row.created_at,
      updated_at : row.updated_at,
      finalized_at : row.finalized_at
    }));

    if ( process.env.NODE_ENV === 'local' ) {
      console.log('\n\nSuccess fetching claims: ', claims, '\n\n');
    }
    res.status(200).json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).send('Error fetching claims');
  }
});

app.get('/api/claims/:distributionYear?/radio', authenticateToken, async (req, res) => {
  const { userId } = req.query;
  const distributionYear = req.params.distributionYear;
  const schema = distributionYear ? (distributionMapping[distributionYear] || 'public') : 'public';

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const result = await pool.query(
      `SELECT
        c.id AS claimId,
        c.signature,
        COALESCE(pt.id, pte.id) AS titleradio_id,
        COALESCE(pt.title, pte.title_extra) AS titleradio_title,
        t.id AS type_id,
        t.type,
        p.id AS periodicity_id,
        p.periodicity,
        r.id AS role_id,
        r.role,
        c.wordcount,
        c.circulation,
        c.finalflag AS "finalFlag",
        c.created_at AS created_at,
        c.updated_at AS updated_at,
        c.finalized_at AS finalized_at,
        CASE WHEN pte.id IS NOT NULL THEN true ELSE false END AS custom
      FROM "${schema}".claims_radio c
      LEFT JOIN "${schema}".claims_titles_radio pt ON c.title_radio_id = pt.id
      LEFT JOIN "${schema}".claims_titles_radio_extra pte ON c.title_radio_id_extra = pte.id
      LEFT JOIN "${schema}".claims_radio_types t ON c.radio_type_id = t.id
      LEFT JOIN "${schema}".claims_periodicities p ON c.periodicity_id = p.id
      LEFT JOIN "${schema}".claims_roles r ON c.role_id = r.id
      WHERE c.user_id = $1
      ORDER BY c.id`, // Order by claimId
      [userId]
    );
    //LEFT JOIN claims_wordcounts wc ON c.wordcount_id = wc.id
    //LEFT JOIN claims_circulations cl ON c.circulation_id = cl.id

    // Print each row line by line
    if ( process.env.NODE_ENV === 'local' ) {
      result.rows.forEach(row => {
        console.log('Row:', row);
      });
    }

    const claims = result.rows.map(row => ({
      claimId: row.claimid,
      titleRadio: {
        id: row.titleradio_id,
        title: row.titleradio_title,
        custom: row.custom
      },
      signature: row.signature,
      radioType: {
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
      wordcount: null,
      circulation: null,
      finalFlag: row.finalFlag,
      created_at : row.created_at,
      updated_at : row.updated_at,
      finalized_at : row.finalized_at
    }));

    if ( process.env.NODE_ENV === 'local' ) {
      console.log('\n\nSuccess fetching claims: ', claims, '\n\n');
    }
    res.status(200).json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).send('Error fetching claims');
  }
});




app.post('/api/claims/paper/saveClaims', async (req, res) => {
  const { userId, claims, finalFlag } = req.body;

  if ( process.env.NODE_ENV === 'local' ) {
    console.log('Received userId:', userId);
    console.log('Received paper claims:', JSON.stringify(claims, null, 2));
    console.log('Received finalFlag:', finalFlag);
  }

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
        paperType,
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
            paper_type_id, periodicity_id, role_id, wordcount_id, circulation_id, finalFlag, created_at, finalized_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP,
                    CASE WHEN $11 THEN CURRENT_TIMESTAMP ELSE NULL END)`,
          [
            userId, signature, title_paper_id, title_paper_id_extra,
            paperType.id, periodicity.id, role.id, wordcountId, circulation.id, finalFlag,
                    finalFlag
          ]
        );
      } else {
        await pool.query(
          `UPDATE claims_paper SET
            user_id = $1, signature = $2, title_paper_id = $3,
            title_paper_id_extra = $4, paper_type_id = $5, periodicity_id = $6,
            role_id = $7, wordcount_id = $8, circulation_id = $9, finalFlag = $10, updated_at = CURRENT_TIMESTAMP,
            finalized_at = CASE WHEN $11 THEN CURRENT_TIMESTAMP ELSE finalized_at END
          WHERE id = $12`,
          [
            userId, signature, title_paper_id, title_paper_id_extra,
            paperType.id, periodicity.id, role.id, wordcountId, circulation.id, finalFlag, finalFlag, claimId
          ]
        );
      }
    }

    await pool.query('COMMIT');
    if ( process.env.NODE_ENV === 'production' ) {
      console.log(`[${new Date().toISOString()}] [${finalFlag ? 'FINAL SAVE' : 'TEMP SAVE'} (paper) EVENT] : user_id: ${userId}`);
    }
    res.status(200).json({ message: 'Claims saved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error saving claims:', error);
    res.status(500).send('Error saving claims');
  }
});

app.post('/api/claims/internet/saveClaims', async (req, res) => {
  const { userId, claims, finalFlag } = req.body;

  if ( process.env.NODE_ENV === 'local' ) {
    console.log('Received userId:', userId);
    console.log('Received internet claims:', JSON.stringify(claims, null, 2));
    console.log('Received finalFlag:', finalFlag);
  }

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
        internetType,
        periodicity,
        role,
        wordcount,
        pageviews
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
            internet_type_id, periodicity_id, role_id, wordcount_id, pageviews_id, finalFlag, created_at, finalized_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP,
                    CASE WHEN $11 THEN CURRENT_TIMESTAMP ELSE NULL END)`,
          [
            userId, signature, title_internet_id, title_internet_id_extra,
            internetType.id, periodicity.id, role.id, wordcountId, pageviews.id, finalFlag,
            finalFlag
          ]
        );
      } else {
        await pool.query(
          `UPDATE claims_internet SET
            user_id = $1, signature = $2, title_internet_id = $3,
            title_internet_id_extra = $4, internet_type_id = $5, periodicity_id = $6,
            role_id = $7, wordcount_id = $8, pageviews_id = $9, finalFlag = $10, updated_at = CURRENT_TIMESTAMP,
            finalized_at = CASE WHEN $11 THEN CURRENT_TIMESTAMP ELSE finalized_at END
          WHERE id = $12`,
          [
            userId, signature, title_internet_id, title_internet_id_extra,
            internetType.id, periodicity.id, role.id, wordcountId, pageviews.id, finalFlag, finalFlag, claimId
          ]
        );
      }
    }

    await pool.query('COMMIT');
    if ( process.env.NODE_ENV === 'production' ) {
      console.log(`[${new Date().toISOString()}] [${finalFlag ? 'FINAL SAVE' : 'TEMP SAVE'} (internet) EVENT] : user_id: ${userId}`);
    }
    res.status(200).json({ message: 'Claims saved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error saving claims:', error);
    res.status(500).send('Error saving claims');
  }
});

app.post('/api/claims/tv/saveClaims', async (req, res) => {
  const { userId, claims, finalFlag } = req.body;

  if ( process.env.NODE_ENV === 'local' ) {
    console.log('Received userId:', userId);
    console.log('Received tv claims:', JSON.stringify(claims, null, 2));
    console.log('Received finalFlag:', finalFlag);
  }

  try {
    await pool.query('BEGIN');

    // Fetch all existing claims for the user
    const existingClaimsResult = await pool.query(
      'SELECT id FROM claims_tv WHERE user_id = $1',
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
        'DELETE FROM claims_tv WHERE id = ANY($1::int[])',
        [claimsToDelete]
      );
    }

    for (const claim of claims) {
      const {
        claimId,
        titleTv,
        signature,
        tvType,
        periodicity,
        role,
        wordcount,
        circulation
      } = claim;

      let title_tv_id = null;
      let title_tv_id_extra = null;

      if (titleTv.custom) {
        if (titleTv.id === -1) {
          const result = await pool.query(
            'INSERT INTO claims_titles_tv_extra (title_extra) VALUES ($1) RETURNING id',
            [titleTv.title]
          );
          title_tv_id_extra = result.rows[0].id;
        } else {
          title_tv_id_extra = titleTv.id;
        }
      } else {
        title_tv_id = titleTv.id;
      }

      if (claimId === -1) {
        await pool.query(
          `INSERT INTO claims_tv (
            user_id, signature, title_tv_id, title_tv_id_extra,
            tv_type_id, periodicity_id, role_id, wordcount, circulation, finalFlag, created_at, finalized_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP,
                    CASE WHEN $11 THEN CURRENT_TIMESTAMP ELSE NULL END)`,
          [
            userId, signature, title_tv_id, title_tv_id_extra,
            tvType.id, periodicity.id, role.id, wordcount, circulation, finalFlag,
            finalFlag
          ]
        );
      } else {
        await pool.query(
          `UPDATE claims_tv SET
            user_id = $1, signature = $2, title_tv_id = $3,
            title_tv_id_extra = $4, tv_type_id = $5, periodicity_id = $6,
            role_id = $7, wordcount = $8, circulation = $9, finalFlag = $10, updated_at = CURRENT_TIMESTAMP,
            finalized_at = CASE WHEN $11 THEN CURRENT_TIMESTAMP ELSE finalized_at END
          WHERE id = $12`,
          [
            userId, signature, title_tv_id, title_tv_id_extra,
            tvType.id, periodicity.id, role.id, wordcount, circulation, finalFlag, finalFlag, claimId
          ]
        );
      }
    }

    await pool.query('COMMIT');
    if ( process.env.NODE_ENV === 'production' ) {
      console.log(`[${new Date().toISOString()}] [${finalFlag ? 'FINAL SAVE' : 'TEMP SAVE'} (tv) EVENT] : user_id: ${userId}`);
    }
    res.status(200).json({ message: 'Claims saved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error saving claims:', error);
    res.status(500).send('Error saving claims');
  }
});

app.post('/api/claims/radio/saveClaims', async (req, res) => {
  const { userId, claims, finalFlag } = req.body;

  if ( process.env.NODE_ENV === 'local' ) {
    console.log('Received userId:', userId);
    console.log('Received radio claims:', JSON.stringify(claims, null, 2));
    console.log('Received finalFlag:', finalFlag);
  }

  try {
    await pool.query('BEGIN');

    // Fetch all existing claims for the user
    const existingClaimsResult = await pool.query(
      'SELECT id FROM claims_radio WHERE user_id = $1',
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
        'DELETE FROM claims_radio WHERE id = ANY($1::int[])',
        [claimsToDelete]
      );
    }

    for (const claim of claims) {
      const {
        claimId,
        titleRadio,
        signature,
        radioType,
        periodicity,
        role,
        wordcount,
        circulation
      } = claim;

      let title_radio_id = null;
      let title_radio_id_extra = null;

      if (titleRadio.custom) {
        if (titleRadio.id === -1) {
          const result = await pool.query(
            'INSERT INTO claims_titles_radio_extra (title_extra) VALUES ($1) RETURNING id',
            [titleRadio.title]
          );
          title_radio_id_extra = result.rows[0].id;
        } else {
          title_radio_id_extra = titleRadio.id;
        }
      } else {
        title_radio_id = titleRadio.id;
      }

      if (claimId === -1) {
        await pool.query(
          `INSERT INTO claims_radio (
            user_id, signature, title_radio_id, title_radio_id_extra,
            radio_type_id, periodicity_id, role_id, wordcount, circulation, finalFlag, created_at, finalized_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP,
                    CASE WHEN $11 THEN CURRENT_TIMESTAMP ELSE NULL END)`,
          [
            userId, signature, title_radio_id, title_radio_id_extra,
            radioType.id, periodicity.id, role.id, wordcount, circulation, finalFlag,
            finalFlag
          ]
        );
      } else {
        await pool.query(
          `UPDATE claims_radio SET
            user_id = $1, signature = $2, title_radio_id = $3,
            title_radio_id_extra = $4, radio_type_id = $5, periodicity_id = $6,
            role_id = $7, wordcount = $8, circulation = $9, finalFlag = $10, updated_at = CURRENT_TIMESTAMP,
            finalized_at = CASE WHEN $11 THEN CURRENT_TIMESTAMP ELSE finalized_at END
          WHERE id = $12`,
          [
            userId, signature, title_radio_id, title_radio_id_extra,
            radioType.id, periodicity.id, role.id, wordcount, circulation, finalFlag, finalFlag, claimId
          ]
        );
      }
    }

    await pool.query('COMMIT');
    if ( process.env.NODE_ENV === 'production' ) {
      console.log(`[${new Date().toISOString()}] [${finalFlag ? 'FINAL SAVE' : 'TEMP SAVE'} (radio) EVENT] : user_id: ${userId}`);
    }
    res.status(200).json({ message: 'Claims saved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error saving claims:', error);
    res.status(500).send('Error saving claims');
  }
});


app.get('/api/claims/dropdownData', authenticateToken, async (req, res) => {
  const client = await pool.connect();
//disablePeriodicitiesIdsForTvsRadios
  try {
    const titlePapersResult = await client.query('SELECT * FROM claims_titles_papers');
    const titleInternetResult = await client.query('SELECT * FROM claims_titles_internet');
    const titleTvResult = await client.query('SELECT * FROM claims_titles_tv');
    const titleRadioResult = await client.query('SELECT * FROM claims_titles_radio');
    const papertypesResult = await client.query('SELECT * FROM claims_paper_types');
    const internettypesResult = await client.query('SELECT * FROM claims_internet_types');
    const tvtypesResult = await client.query('SELECT * FROM claims_tv_types');
    const radiotypesResult = await client.query('SELECT * FROM claims_radio_types');
    const periodicitiesResult = await client.query('SELECT * FROM claims_periodicities');
    const rolesResult = await client.query('SELECT * FROM claims_roles');
    const wordcountsResult = await client.query('SELECT * FROM claims_wordcounts');
    const circulationsResult = await client.query('SELECT * FROM claims_circulations');
    const pageviewsResult = await client.query('SELECT * FROM claims_pageviews');

    // Add disableWordCount flag to each role
    const roles = rolesResult.rows.map(role => ({
      ...role,
      disableWordCount: disableWordCountRoleIds.includes(role.id)
    }));

    res.json({
      titlePapers: titlePapersResult.rows,
      titleInternet: titleInternetResult.rows,
      titleTv: titleTvResult.rows,
      titleRadio: titleRadioResult.rows,

      papertypes: papertypesResult.rows,
      internettypes: internettypesResult.rows,
      tvtypes: tvtypesResult.rows,
      radiotypes: radiotypesResult.rows,

      periodicities: periodicitiesResult.rows,
      tvperiodicities: periodicitiesResult.rows.filter(row => !disablePeriodicitiesIdsForTvsRadios.includes(row.id)),
      radioperiodicities: periodicitiesResult.rows.filter(row => !disablePeriodicitiesIdsForTvsRadios.includes(row.id)),
      roles: roles,
      wordcounts: wordcountsResult.rows,
      circulations: circulationsResult.rows,
      pageviews: pageviewsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});








// Serve PDF distribution files
app.get('/api/download/distributions', authenticateToken, async (req, res) => {

  const { am } = req.query;
  const pdfPath = path.join(__dirname, '..', '..', 'xenophon', 'src', 'assets', '2023_distribution', `${am}_distribution_2023.pdf`);
console.log('Distribution path: ' + pdfPath);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ message: "PDF file not found" });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${am}_distribution_2023.pdf"`);

  const fileStream = fs.createReadStream(pdfPath);
  fileStream.pipe(res);
});

// Serve PDF distribution files
app.get('/api/download/contracts', authenticateToken, async (req, res) => {

  const { am } = req.query;
  const contractsDir = path.join(__dirname, '..', '..', 'xenophon', 'src', 'assets', '2023_contracts');

  let fileName;
  try {
    const files = fs.readdirSync(contractsDir);
    fileName = files.find(f => f.startsWith(`${am}_`));
  } catch (err) {
    console.error('Error reading contracts directory:', err);
    return res.status(500).json({ message: "Internal server error" });
  }

  if (!fileName) {
    return res.status(404).json({ message: "PDF file not found" });
  }

  const pdfPath = path.join(contractsDir, fileName);
console.log('Contract path: ' + pdfPath);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${am}_contract_2023.pdf"`);

  const fileStream = fs.createReadStream(pdfPath);
  fileStream.pipe(res);
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


// Function to format date to dd/mm/yyyy
const formatToGRDate = (dateString) => {
  if (!dateString) return null;

  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

// Utility function to convert date to Postgres yyyy-mm-dd
function formatToPostgresDate(dateString) {
  if (!dateString) return null;

  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
}
