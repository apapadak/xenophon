const xlsx = require('xlsx');
const { Pool } = require('pg');
const fs = require('fs');

// Database pool setup
const pool = new Pool({
  user: 'xenophon_user',
  host: 'localhost',
  database: 'xenophon',
  password: 'Xen8Hop!',
  port: 5432,
});

const workbook = xlsx.readFile('types.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

// Utility to filter strings and print values
function filterAndPrintStrings(columnValues, columnName) {
  const validStrings = columnValues.filter(value => typeof value === 'string' && value.trim() !== '');
  console.log(`Values in ${columnName}:`, validStrings);
  return validStrings;
}

// Utility to check for duplicates and print them
function checkAndPrintDuplicates(array) {
  const items = new Set();
  const duplicates = new Set();
  array.forEach(item => {
    if (items.has(item)) {
      duplicates.add(item);
    }
    items.add(item);
  });
  if (duplicates.size > 0) {
    console.error(`Duplicate values found in the array:`, Array.from(duplicates));
  }
  return duplicates;
}

// Function to process individual columns
async function processColumn(columnData, columnName, tableName, dbColumnName, sequenceName) {
  const values = filterAndPrintStrings(columnData, columnName);
  const duplicates = checkAndPrintDuplicates(values);
  if (duplicates.size > 0) {
    throw new Error(`Duplicate values found in ${columnName}`);
  }

  // Delete all rows in the table before inserting new values
  await pool.query(`DELETE FROM ${tableName}`);

  // Reset the ID sequence
  await pool.query(`ALTER SEQUENCE ${sequenceName} RESTART WITH 1`);

  // Insert values into the database
  for (let value of values) {
    await pool.query(`INSERT INTO ${tableName} (${dbColumnName}) VALUES ($1)`, [value]);
  }

  /*const queries = values.map(value => {
    const formattedValue = value !== null ? `'${value}'` : 'NULL';
    return `INSERT INTO ${tableName} (${dbColumnName}) VALUES (${formattedValue});`;
  });

  fs.appendFileSync('types.sql', queries.join('\n') + '\n', 'utf8');*/
}

async function main() {
  try {
    //fs.writeFileSync('types.sql', '', 'utf8');

    await pool.connect(); // Connect to the database
    await pool.query('BEGIN'); // Start a transaction

    // Process each column with the correct database column name
    await processColumn(data.map(row => row.claims_publication_titles), 'publication_title', 'claims_publication_titles', 'publication_title', 'claims_publication_titles_id_seq');
    await processColumn(data.map(row => row.claims_types), 'claims_types', 'claims_types', 'type', 'claims_types_id_seq');
    await processColumn(data.map(row => row.claims_periodicity), 'claims_periodicity', 'claims_periodicity', 'periodicity', 'claims_periodicity_id_seq');
    await processColumn(data.map(row => row.claims_role), 'claims_role', 'claims_role', 'role', 'claims_role_id_seq');
    await processColumn(data.map(row => row.claims_wordcount), 'claims_wordcount', 'claims_wordcount', 'wordcount', 'claims_wordcount_id_seq');
    await processColumn(data.map(row => row.claims_circulation), 'claims_circulation', 'claims_circulation', 'circulation', 'claims_circulation_id_seq');

    await pool.query('COMMIT'); // Commit transaction
    console.log('All data committed successfully');
  } catch (error) {
    console.error('Error processing data:', error.message);
    await pool.query('ROLLBACK'); // Rollback in case of error
  } finally {
    await pool.end(); // Close the pool
  }
}

main();
