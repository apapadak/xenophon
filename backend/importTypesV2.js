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

// Custom sort function
function customSort(a, b) {
  const greekRegex = /^[\u0370-\u03FF\u1F00-\u1FFF]/; // Greek letters
  const numberRegex = /^[0-9]/;   // Numbers
  const symbolRegex = /^[^A-Za-z0-9\u0370-\u03FF\u1F00-\u1FFF]/; // Symbols

  const isGreekA = greekRegex.test(a);
  const isGreekB = greekRegex.test(b);
  const isNumberA = numberRegex.test(a);
  const isNumberB = numberRegex.test(b);
  const isSymbolA = symbolRegex.test(a);
  const isSymbolB = symbolRegex.test(b);

  if (isGreekA && !isGreekB) return -1;
  if (!isGreekA && isGreekB) return 1;
  if (isNumberA && !isNumberB) return -1;
  if (!isNumberA && isNumberB) return 1;
  if (isSymbolA && !isSymbolB) return -1;
  if (!isSymbolA && isSymbolB) return 1;

  return a.localeCompare(b); // Default locale compare for other cases
}

// Function to process publication titles
async function processPublicationTitles(columnData, columnName, tableName, dbColumnName, sequenceName) {
  const values = filterAndPrintStrings(columnData, columnName);
  const duplicates = checkAndPrintDuplicates(values);
  if (duplicates.size > 0) {
    throw new Error(`Duplicate values found in ${columnName}`);
  }

  // Lowercase all entries
  const lowercaseValues = values.map(value => value.toLowerCase());

  // Sort values using custom sort function
  const sortedValues = lowercaseValues.sort(customSort);

  // Remove duplicates
  const uniqueValues = [...new Set(sortedValues)];

  // Delete all rows in the table before inserting new values
  await pool.query(`DELETE FROM ${tableName}`);

  // Reset the ID sequence
  await pool.query(`ALTER SEQUENCE ${sequenceName} RESTART WITH 1`);

  // Insert values into the database
  for (let value of uniqueValues) {
    await pool.query(`INSERT INTO ${tableName} (${dbColumnName}) VALUES ($1)`, [value]);
  }
}

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
    await pool.connect(); // Connect to the database
    await pool.query('BEGIN'); // Start a transaction

    // Process claims_publication_titles with the specific requirements
    await processPublicationTitles(data.map(row => row.claims_publication_titles), 'publication_title', 'claims_publication_titles', 'publication_title', 'claims_publication_titles_id_seq');

    // Process each column with the correct database column name
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
