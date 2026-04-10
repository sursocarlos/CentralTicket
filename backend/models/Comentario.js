const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Comentario = sequelize.define(
    "Comentario",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      contenido: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: "El comentario no puede estar vacío" },
        },
      },
      id_incidencia: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "comentarios",
      timestamps: true,
      createdAt: "fecha_creacion",
      updatedAt: false,
    },
  );

  return Comentario;
};
