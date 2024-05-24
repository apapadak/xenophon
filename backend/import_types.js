const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');  // Using bcryptjs for hashing
const { Pool } = require('pg');

// Load the workbook
const workbook = XLSX.readFile('Final_Modified_DATAdb.xlsx');
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

async function hashPasswords(data) {
  const saltRounds = 10;
  for (const row of data) {
    //console.log(row.password);
    if (row.password) {  // Ensure there's a password to hash
      row.password = await bcrypt.hash(row.password, saltRounds);
      console.log(`Hashed password for ${row.username}: ${row.password}`);  // Print each hashed password
    }
  }
  return data;
}

async function insertData(data) {
  try {
    for (const row of data) {
      const query = "INSERT INTO users ( afm, password, firstname, surname, father_name, tax_office, dob, adt, iban, bank, legal_form, address, city, postal_code, country, telephone, mobile, email_1, email_2, created_at ) "  +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP)";

      //const query = "INSERT INTO users (firstname, surname, username, password, email_1, email_2, created_at) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)";
      const values = [row.afm, row.password, row.firstname, row.surname, row.father_name, row.tax_office, row.dob, row.adt, row.iban, row.bank, row.legal_form, row.address, row.city, row.postal_code, row.country,
        row.telephone, row.mobile, row.email_1, row.email_2];

      // Print the query and values
      console.log("Executing query:", query);
      console.log("With values:", values);

      await pool.query(query, values);
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await pool.end();
  }
}

async function processUsers() {
  const hashedData = await hashPasswords(data);
  await insertData(hashedData);
  console.log('Data inserted successfully.');
}

processUsers();
