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
db.chatMessages = require('./chatMessage.model.js')(sequelize, Sequelize);
db.chatThreads = require('./chatThread.model.js')(sequelize, Sequelize);
db.activityType = require('./activityType.model.js')(sequelize, Sequelize);

// Define associations
db.users.hasMany(db.userClientMap, { foreignKey: 'userId' });
db.userClientMap.belongsTo(db.users, { foreignKey: 'userId' });

db.users.hasMany(db.reminders, { foreignKey: 'userId' });
db.reminders.belongsTo(db.users, { foreignKey: 'userId' });

db.users.hasMany(db.chatThreads, { foreignKey: 'userId' });
db.chatThreads.belongsTo(db.users, { foreignKey: 'userId' });

db.chatThreads.hasMany(db.chatMessages, { foreignKey: 'threadId' });
db.chatMessages.belongsTo(db.chatThreads, { foreignKey: 'threadId' });

// Sync all models and insert default record
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized successfully!');
    const activityTypeModel = require('./activityType.model.js')(sequelize, Sequelize);
    activityTypeModel.initializeActivityTypes();
  })
  .catch(error => {
    console.error('Error synchronizing database:', error);
  });

module.exports = {
  db
};