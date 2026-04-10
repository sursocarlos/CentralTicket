const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Incidencia = sequelize.define(
    "Incidencia",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "El título no puede estar vacío" },
          len: {
            args: [5, 200],
            msg: "El título debe tener entre 5 y 200 caracteres",
          },
        },
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: "La descripción no puede estar vacía" },
        },
      },
      estado: {
        type: DataTypes.ENUM("abierta", "en proceso", "resuelta"),
        defaultValue: "abierta",
      },
      prioridad: {
        type: DataTypes.ENUM("baja", "media", "alta"),
        defaultValue: "media",
      },
      url_adjunto: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_creador: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_tecnico: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      id_categoria: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "incidencias",
      timestamps: true,
      createdAt: "fecha_creacion",
      updatedAt: "fecha_actualizacion",
    },
  );

  return Incidencia;
};
