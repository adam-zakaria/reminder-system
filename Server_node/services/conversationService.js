const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Store conversation in Excel file
function storeConversationInExcel(sessionId, userId, username, role, content, timestamp) {
  const filePath = path.join(__dirname, '../conversations.xlsx');
  let workbook, worksheet;

  // Check if the Excel file exists
  if (fs.existsSync(filePath)) {
    workbook = xlsx.readFile(filePath);
    worksheet = workbook.Sheets['Conversations'];
  } else {
    // Create a new workbook and worksheet if the file doesn't exist
    workbook = xlsx.utils.book_new();
    worksheet = xlsx.utils.aoa_to_sheet([['Session ID', 'User ID', 'Username', 'Role', 'Content', 'Timestamp']]);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Conversations');
  }

  // Add the new message to the worksheet
  const newRow = [sessionId, userId, username, role, content, timestamp];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  rows.push(newRow);
  worksheet = xlsx.utils.aoa_to_sheet(rows);
  workbook.Sheets['Conversations'] = worksheet;

  // Write the updated workbook back to the file
  xlsx.writeFile(workbook, filePath);
}

module.exports = { storeConversationInExcel };
