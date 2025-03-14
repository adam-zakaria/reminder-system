module.exports = (sequelize, Sequelize) => {
    const ReminderUserMapping = sequelize.define('reminderUserMapping', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reminderId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'reminders',
          key: 'id',
        },
      },
      sharedWithUserId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    });
  
    return ReminderUserMapping;
  };
  