const cron = require('node-cron');

console.log("Starting cron test job...");

// Schedule a job that runs every 10 seconds
cron.schedule('*/10 * * * * *', () => {
  console.log("Cron test job fired at", new Date().toISOString());
});
