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
  });

  return Reminder;
};
