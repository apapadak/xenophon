require('dotenv').config(); // Load environment variables

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const DBURL = process.env.DATABASE_URL;

// PostgreSQL connection setup
const pool = new Pool({
  connectionString: DBURL,
  ssl: false
});

async function updatePasswordsUsingMhtrwo() {
  try {
    // Retrieve user_id and mhtrwo for every user
    const { rows: users } = await pool.query('SELECT user_id, mhtrwo FROM public.users');
    const saltRounds = 10;

    for (const user of users) {
      if (!user.mhtrwo) {
        console.log(`User with id ${user.user_id} has no mhtrwo value; skipping.`);
        continue;
      }

      const plainValue = user.mhtrwo.toString().trim();
      const hashedPassword = await bcrypt.hash(plainValue, saltRounds);

      await pool.query('UPDATE public.users SET password = $1 WHERE user_id = $2', [hashedPassword, user.user_id]);
      console.log(`Updated password for user_id ${user.user_id} using mhtrwo value.`);
    }

    console.log('All user passwords updated using mhtrwo values.');
  } catch (err) {
    console.error('Error updating passwords:', err.stack);
  } finally {
    await pool.end();
  }
}

updatePasswordsUsingMhtrwo();
