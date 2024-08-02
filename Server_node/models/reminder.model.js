// models/reminder.js
module.exports = (sequelize, Sequelize) => {
  const Reminder = sequelize.define('reminder', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: Sequelize.UUID, // Change to UUID to match User model
      references: {
        model: 'users', // Name of the User model table
        key: 'id'
      }
    },
    message: {
      type: Sequelize.STRING,
    },
    interval: {
      type: Sequelize.STRING,
    },
    time: {
      type: Sequelize.DATE,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    utility_name: {
      type: Sequelize.STRING,
    },
    component_name: {
      type: Sequelize.STRING,
    },
    condition: {
      type: Sequelize.STRING,
    },
    display: {
      type: Sequelize.STRING,
    },
    delay: {
      type: Sequelize.INTEGER,
    },
    sent: {
      type: Sequelize.BOOLEAN,
    },
    disappearOnCondition: {
      type: Sequelize.BOOLEAN,
    },
    activity: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    triggerTime: { // New field for specifying time before or after the activity
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    triggerType: { // New field for specifying before or after the activity
      type: Sequelize.ENUM('begin', 'end'),
      allowNull: true,
    },
    lightCategoryId: { // New field for light category ID
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });

  return Reminder;
};
