module.exports = (sequelize, Sequelize) => {
    const SentReminder = sequelize.define('sentReminder', {
      reminderId: {
        type: Sequelize.INTEGER,
      },
      clientId: {
        type: Sequelize.STRING,
      },
    });
  
    return SentReminder;
  };
  