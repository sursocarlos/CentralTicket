const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Categoria = sequelize.define(
    "Categoria",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "El nombre de la categoría no puede estar vacío" },
        },
      },
      color: {
        type: DataTypes.STRING,
        defaultValue: "#6366f1",
      },
      activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "categorias",
      timestamps: true,
      createdAt: "fecha_creacion",
      updatedAt: false,
    },
  );

  return Categoria;
};
