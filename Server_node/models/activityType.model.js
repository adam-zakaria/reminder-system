module.exports = (sequelize, Sequelize) => {
  const ActivityTypes = sequelize.define('ActivityTypes', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
  });

  // List of predefined activity types
  const predefinedActivities = [
    'Bed_To_Toilet',
    'Eating',
    'Enter_Home',
    'Leave_Home',
    'Meal_Preparation',
    'Relax',
    'Sleep',
    'Use_Bathroom',
    'Work',
  ];

  // Function to initialize ActivityTypes table with predefined activities
  const initializeActivityTypes = async () => {
    // Check if each predefined activity type exists, create it if not
    for (const activity of predefinedActivities) {
      const existingActivityType = await ActivityTypes.findOne({ where: { name: activity } });
      if (!existingActivityType) {
        await ActivityTypes.create({ name: activity });
      }
    }
  };

  // Call the initialization function to populate the table if necessary
  // initializeActivityTypes(); // Commented out this line

  // Export the model and the initializeActivityTypes function
  return {
    ActivityTypes,
    initializeActivityTypes
  };
};