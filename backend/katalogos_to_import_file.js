const xlsx = require('xlsx');
const path = require('path');

// Load the Excel file
const filePath = path.join(__dirname, '2024_ΚΕΝΤΡΙΚΟΣ_ΚΑΤΑΛΟΓΟΣ-4.xlsx');
const workbook = xlsx.readFile(filePath);

// Load the second sheet
const sheetName = workbook.SheetNames[1];
const sheet = workbook.Sheets[sheetName];

// Convert the sheet to JSON, skipping the first line which is the header
const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

// Define the header mapping
const headerMapping = {
  'FINAL-AFM': 'afm',
  'ΑΡ. ΜΗΤΡ.': 'mhtrwo',
  'ΟΝΟΜΑ': 'firstname',
  'ΕΠΩΝΥΜΟ': 'surname',
  'ΠΑΤΡΩΝΥΜΟ': 'father_name',
  'ΔΟΥ': 'tax_office',
  'Bdate': 'dob',
  'ΑΔΤ': 'adt',
  'ΙΒΑΝ ': 'iban',
  'ΤΡΑΠΕΖΑ': 'bank',
  'ΝΟΜΙΚΗ ΜΟΡΦΗ': 'legal_form',
  'ΔΙΕΥΘΥΝΣΗ': 'address',
  'ΠΟΛΗ': 'city',
  'ΤΑΧΥΔΡΟΜΙΚΟΣ ΚΩΔΙΚΑΣ': 'postal_code',
  'ΧΩΡΑ': 'country',
  'ΤΗΛΕΦΩΝΟ': 'telephone',
  'ΤΗΛ': 'mobile',
  'E-MAIL 1': 'email_1',
  'E-MAIL 2': 'email_2'
};

// Function to format date
const formatDate = (dateString) => {
  if (!dateString || dateString === '#N/A') return '';

  // Check if the value is a number (Excel serial date)
  if (typeof dateString === 'number') {
    const date = new Date(Date.UTC(0, 0, dateString - 1)); // Adjust the serial date to maintain the correct date
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  if (typeof dateString !== 'string') {
    dateString = dateString.toString();
  }

  const dateParts = dateString.split(/[./-]/);

  if (dateParts.length !== 3) return dateString;

  const [day, month, year] = dateParts.map(part => part.padStart(2, '0'));

  if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
    return `${day}/${month}/${year}`;
  }

  return dateString;
};

// Create a new array for the new Excel file data
const newData = data.map(row => {
  const newRow = {};
  for (const oldHeader in headerMapping) {
    if (row.hasOwnProperty(oldHeader)) {
      let value = row[oldHeader];
      if (headerMapping[oldHeader] === 'dob' && value) {
        value = formatDate(value);
      }
      newRow[headerMapping[oldHeader]] = value;
    }
  }
  // Add the 'mhtrwo' and 'password' columns with the same value from 'ΑΡ. ΜΗΤΡ.'
  if (row.hasOwnProperty('ΑΡ. ΜΗΤΡ.')) {
    newRow['mhtrwo'] = row['ΑΡ. ΜΗΤΡ.'];
    newRow['password'] = row['ΑΡ. ΜΗΤΡ.'];
  }
  return newRow;
});

// Ensure columns are in the correct order
const orderedColumns = ['afm', 'mhtrwo', 'password', 'firstname', 'surname', 'father_name', 'tax_office', 'dob', 'adt', 'iban', 'bank', 'legal_form', 'address', 'city', 'postal_code', 'country', 'telephone', 'mobile', 'email_1', 'email_2'];
const orderedData = newData.map(row => {
  const orderedRow = {};
  orderedColumns.forEach(col => {
    orderedRow[col] = row[col] || '';
  });
  return orderedRow;
});

// Create a new workbook and add the new data
const newWorkbook = xlsx.utils.book_new();
const newSheet = xlsx.utils.json_to_sheet(orderedData);
xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Sheet1');

// Write the new workbook to a file
const outputFilePath = path.join(__dirname, 'new_file.xlsx');
xlsx.writeFile(newWorkbook, outputFilePath);

console.log('New Excel file created successfully:', outputFilePath);
