const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize) => {
  const Usuario = sequelize.define(
    "Usuario",
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
          notEmpty: { msg: "El nombre no puede estar vacío" },
          len: {
            args: [2, 100],
            msg: "El nombre debe tener entre 2 y 100 caracteres",
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Este email ya está registrado" },
        validate: {
          isEmail: { msg: "Introduce un email válido" },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rol: {
        type: DataTypes.ENUM("admin", "tecnico", "empleado"),
        allowNull: false,
        defaultValue: "empleado",
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      fecha_creacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      fecha_actualizacion: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "usuarios",
      timestamps: true,
      createdAt: "fecha_creacion",
      updatedAt: "fecha_actualizacion",
      hooks: {
        // Hashea la contraseña automáticamente antes de guardar
        beforeCreate: async (usuario) => {
          if (usuario.password) {
            usuario.password = await bcrypt.hash(usuario.password, 12);
          }
        },
        beforeUpdate: async (usuario) => {
          if (usuario.changed("password")) {
            usuario.password = await bcrypt.hash(usuario.password, 12);
          }
        },
      },
    },
  );

  // Método de instancia para verificar contraseña
  Usuario.prototype.verificarPassword = async function (passwordPlano) {
    return bcrypt.compare(passwordPlano, this.password);
  };

  // Método para devolver usuario sin la contraseña
  Usuario.prototype.toSafeJSON = function () {
    const { password, ...datos } = this.toJSON();
    return datos;
  };

  return Usuario;
};
