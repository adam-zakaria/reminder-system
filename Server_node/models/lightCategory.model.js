module.exports = (sequelize, DataTypes) => {
  const LightCategory = sequelize.define('LightCategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  LightCategory.associate = (models) => {
    LightCategory.hasMany(models.Reminder, { foreignKey: 'lightCategoryId' });
  };

  return LightCategory;
};
