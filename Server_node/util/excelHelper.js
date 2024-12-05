const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Function to store conversation in Excel
function storeConversationInExcel(sessionId, userId, username, role, content, timestamp) {
  const filePath = path.join(__dirname, '../conversations.xlsx');
  let workbook;
  let worksheet;

  if (fs.existsSync(filePath)) {
    workbook = xlsx.readFile(filePath);
    worksheet = workbook.Sheets['Conversations'];
  } else {
    workbook = xlsx.utils.book_new();
    worksheet = xlsx.utils.aoa_to_sheet([['Session ID', 'User ID', 'Username', 'Role', 'Content', 'Timestamp']]);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Conversations');
  }

  const newRow = [sessionId, userId, username, role, content, timestamp];
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  rows.push(newRow);
  worksheet = xlsx.utils.aoa_to_sheet(rows);
  workbook.Sheets['Conversations'] = worksheet;

  xlsx.writeFile(workbook, filePath);
}

module.exports = { storeConversationInExcel };
