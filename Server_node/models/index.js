const dbConfig = require('../config/db.config.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.reminders = require('./reminder.model.js')(sequelize, Sequelize);
db.userClientMap = require('./userClientMap.model.js')(sequelize, Sequelize);
db.delayTable = require('./delayTable.model.js')(sequelize, Sequelize);
db.sentReminders = require('./sentReminder.model.js')(sequelize, Sequelize);
db.users = require('./user.model.js')(sequelize, Sequelize);
db.chatMessages = require('./chatMessage.model.js')(sequelize, Sequelize); // Add this line
db.chatThreads = require('./chatThread.model.js')(sequelize, Sequelize); // Add this line

// Define associations
db.users.hasMany(db.userClientMap, { foreignKey: 'userId' });
db.userClientMap.belongsTo(db.users, { foreignKey: 'userId' });

db.users.hasMany(db.reminders, { foreignKey: 'userId' });
db.reminders.belongsTo(db.users, { foreignKey: 'userId' });

db.users.hasMany(db.chatThreads, { foreignKey: 'userId' }); // Add this line
db.chatThreads.belongsTo(db.users, { foreignKey: 'userId' }); // Add this line

db.chatThreads.hasMany(db.chatMessages, { foreignKey: 'threadId' }); // Add this line
db.chatMessages.belongsTo(db.chatThreads, { foreignKey: 'threadId' }); // Add this line

// Sync all models and insert default record
sequelize.sync({ force: false, alter: true})
  .then(() => {
    console.log('Database synchronized successfully!');
    // if (db.userClientMap && typeof db.userClientMap.insertDefaultRecord === 'function') {
    //   return db.userClientMap.insertDefaultRecord();
    // } else {
    //   console.error('insertDefaultRecord function not found in userClientMap model.');
    // }
  })
  .catch(error => {
    console.error('Error synchronizing database:', error);
  });

module.exports = {
  db
};
