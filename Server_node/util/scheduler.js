const cron = require('node-cron');
const { exec } = require('child_process');

/**
 * Schedule task based on recurrence type
 * @param {string} recurrenceType - 'daily', 'weekly', 'monthly', 'yearly'
 * @param {string} functionName - The Python function to be called
 */
function scheduleTask(recurrenceType, functionName, params) {
    let cronExpression;
    
    switch (recurrenceType) {
        case 'daily':
            cronExpression = '0 0 * * *';  // Every day at midnight
            break;
        case 'weekly':
            cronExpression = '0 0 * * 0';  // Every Sunday at midnight
            break;
        case 'monthly':
            cronExpression = '0 0 1 * *';  // First day of every month
            break;
        case 'yearly':
            cronExpression = '0 0 1 1 *';  // Every January 1st at midnight
            break;
        default:
            console.error('Unsupported recurrence type');
            return;
    }

    // Schedule the task using the appropriate cron expression
    cron.schedule(cronExpression, () => {
        console.log(`Task scheduled for ${recurrenceType} - running function ${functionName}`);

        // Execute the Python function, passing the current time and additional params
        const currentTime = new Date().toISOString();
        const paramString = params.map(p => JSON.stringify(p)).join(',');

        const command = `python3 script.py ${functionName} ${currentTime} ${paramString}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python function: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Python stderr: ${stderr}`);
                return;
            }
            console.log(`Python function output: ${stdout}`);
        });
    });
}

// Example usage
scheduleTask('daily', 'reminder_clean_kitchen_tomorrow_morning', [{activity: 'Meal_Preparation', status: 'start'}]);

module.exports = { scheduleTask };
