const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');  // Using bcryptjs for hashing
const { Pool } = require('pg');
const fs = require('fs');

// Load the workbook
const workbook = XLSX.readFile('new_file.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
let data = XLSX.utils.sheet_to_json(worksheet);

const pool = new Pool({
  user: 'xenophon_user',
  host: 'localhost',
  database: 'xenophon',
  password: 'Xen8Hop!',
  port: '5432',  // Port should be a number or a numeric string
});

async function clearTable() {
  try {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM users');
    await pool.query('ALTER SEQUENCE users_user_id_seq RESTART WITH 1');
    await pool.query('COMMIT');
    console.log('Table cleared and sequence restarted.');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error clearing table and restarting sequence', err.stack);
  }
}

async function hashPasswords(data) {
  const saltRounds = 10;
  for (const row of data) {
    if (row.password) {  // Ensure there's a password to hash
      const passwordString = row.password.toString().replace(/^\n+|\n+$/g, '').trim();
      row.password = await bcrypt.hash(passwordString, saltRounds);
      console.log(`Hashed password for ${row.afm}: `, passwordString);  // Print each hashed password
    }
  }
  return data;
}

async function insertData(data) {
  try {
    for (const row of data) {
      // Skip rows with an empty afm
      if (!row.afm) {
        console.log('Skipping row with empty afm:', row);
        continue;
      }

      const query = "INSERT INTO users ( afm, mhtrwo, password, firstname, surname, father_name, tax_office, dob, adt, iban, bank, legal_form, address, city, postal_code, country, telephone, mobile, email_1, email_2, created_at ) " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP)";

      const values = [
        row.afm, row.mhtrwo, row.password, row.firstname, row.surname, row.father_name, row.tax_office, row.dob, row.adt, row.iban, row.bank, row.legal_form, row.address, row.city, row.postal_code, row.country,
        row.telephone, row.mobile, row.email_1, row.email_2
      ].map(value => value ? value.toString().replace(/^\n+|\n+$/g, '').trim() : value);

      // Print the query and values
      console.log("Executing query:", query);
      console.log("With values:", values);

      // Execute the query
      await pool.query(query, values);
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await pool.end();
  }
}

async function processUsers() {
  await clearTable();
  const hashedData = await hashPasswords(data);
  await insertData(hashedData);
  console.log('Data inserted successfully.');
}

processUsers();
