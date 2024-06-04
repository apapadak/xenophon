const xlsx = require('xlsx');
const { Pool } = require('pg');

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
async function processColumn(columnData, columnName, tableName, dbColumnName) {
  const values = filterAndPrintStrings(columnData, columnName);
  const duplicates = checkAndPrintDuplicates(values);
  if (duplicates.size > 0) {
    throw new Error(`Duplicate values found in ${columnName}`);
  }
  // Insert values into the database
  for (let value of values) {
    await pool.query(`INSERT INTO ${tableName} (${dbColumnName}) VALUES ($1)`, [value]);
  }
}

async function main() {
  try {
    await pool.connect(); // Connect to the database
    await pool.query('BEGIN'); // Start a transaction

    // Process each column with the correct database column name
    await processColumn(data.map(row => row.claims_publication_titles), 'publication_title', 'claims_publication_titles', 'publication_title');
    await processColumn(data.map(row => row.claims_types), 'claims_types', 'claims_types', 'type');
    await processColumn(data.map(row => row.claims_periodicity), 'claims_periodicity', 'claims_periodicity', 'periodicity');

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
