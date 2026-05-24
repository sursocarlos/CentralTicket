// Le dice a 	Sequelize cómo es la tabla historial_estados y todo su comportamiento:
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const HistorialEstado = sequelize.define(
    "HistorialEstado",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_incidencia: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estado_anterior: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      estado_nuevo: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      fecha_cambio: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "historial_estados",
      timestamps: false,
    },
  );

  return HistorialEstado;
};
