module.exports = (sequelize, Sequelize) => {
    const DelayTable = sequelize.define('delayTable', {
      utility_name: {
        type: Sequelize.STRING,
      },
      delay: {
        type: Sequelize.INTEGER,
      },
    });
  
    return DelayTable;
  };
  