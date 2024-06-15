module.exports = (sequelize, Sequelize) => {
    const ChatThread = sequelize.define('chatThread', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      messages: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
    });
  
    return ChatThread;
  };
  