module.exports = (sequelize, Sequelize) => {
  const UserClientMap = sequelize.define('userClientMap', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: Sequelize.UUID, // Change to UUID to match User model
      allowNull: false,
      references: {
        model: 'users', // Name of the User model table
        key: 'id'
      }
    },
    targetClientId: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'targetClientId']
      }
    ]
  });

  // Define a function to insert default record
  // UserClientMap.insertDefaultRecord = async function () {
  //   try {
  //     await UserClientMap.findOrCreate({
  //       where: { userId: '12345', targetClientId: "home123" }
  //     });
  //     console.log('Default record inserted successfully!');
  //   } catch (error) {
  //     console.error('Error inserting default record:', error);
  //   }
  // };

  return UserClientMap;
};
