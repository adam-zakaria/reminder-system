module.exports = (sequelize, Sequelize) => {
    const ChatMessage = sequelize.define('chatMessage', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      threadId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      assistantId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      }
    });
  
    return ChatMessage;
  };
  