module.exports = (sequelize, DataTypes) => {
    const reminderLibrary = sequelize.define('ReminderLibrary', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      text: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  
    return reminderLibrary;
  };
  