const cron = require('node-cron');

// Calculate the date/time 10 seconds from now
const future = new Date(Date.now() + 10 * 1000);
const sec = future.getSeconds();
const min = future.getMinutes();
const hour = future.getHours();
const dayOfMonth = future.getDate();
const month = future.getMonth() + 1; // JS months are 0-indexed
const dayOfWeek = '*'; // We'll allow any day of the week

// Build a cron expression with seconds precision:
// Format: "sec min hour dayOfMonth month dayOfWeek"
const cronExpression = `${sec} ${min} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
console.log('Cron Expression:', cronExpression);

// Schedule the job using node-cron (which supports seconds field)
const job = cron.schedule(cronExpression, () => {
  console.log('Cron job executed at', new Date().toISOString());
  job.stop(); // Stop the job after it runs once
});
