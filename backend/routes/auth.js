// Este archivo gestiona todo lo relacionado con la autenticación:
// login, obtener el usuario activo y registro de nuevos usuarios. Tiene tres endpoints:

// POST /api/auth/login:
// Comprobamos email y contraseña. Comprobamos que usuario este activo.
// Comprobamos que la contraseña esta cifrada, y en caso de no estarlo la ciframos
// Generamos un token con JWT que dura 8h , contiene el id y el rol del usuario.

// GET /api/auth/me:
// Obtenemos el usuario autenticado, esto se usa para no tener que
// iniciar sesión cada vez que recargamos la pagina, o cambiamos entre las ventanas de la interfaz.

// POST /api/auth/registro:
// Verificamos el token y el rol del usuario para permitir o no el registro del usuario (Solo los admin pueden crear usuarios)
// Comprueba que el email no esté ya registrado y si todo va bien crea el usuario.

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { Usuario } = require("../models");
const {
  verificarToken,
  verificarRol,
} = require("../middlewares/authMiddleware");

// POST /api/auth/login
router.post(
  "/login",
  [
    // Comprobamos que el email tiene el formato valido
    body("email").isEmail().withMessage("Email no válido").normalizeEmail(),

    //Comprobamos que la contraseña no viene vacía
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],

  // Si una de las validaciones anteriores (email o contraseña) falla, salta un error 400
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { email, password } = req.body;

    try {
      // Busca un usuario con ese email y que este ACTIVO. Si no existe o está desactivado,
      // devuelve un 401 con el mensaje genérico "Credenciales incorrectas".
      const usuario = await Usuario.findOne({ where: { email, activo: true } });

      if (!usuario) {
        return res.status(401).json({ error: "Credenciales incorrectas." });
      }

      // Compatibilidad: permite login con contraseñas antiguas en texto plano
      // y las migra a hash bcrypt automáticamente tras login correcto.

      // Detecta si la contraseña almacenada ya es un hash de bcrypt o es texto plano de una versión antigua del proyecto
      const pareceHashBcrypt = /^\$2[aby]\$\d{2}\$/.test(
        usuario.password || "",
      );
      let passwordValida = false;

      // Si es texto plano y coincide, la migra automáticamente a hash en ese mismo momento usando el hook beforeUpdate
      if (pareceHashBcrypt) {
        passwordValida = await usuario.verificarPassword(password);
      } else {
        passwordValida = usuario.password === password;
        if (passwordValida) {
          await usuario.update({ password }); // Hook beforeUpdate aplica hash
        }
      }

      // En caso de que la contraseña no sea correcta lanza un error 401
      if (!passwordValida) {
        return res.status(401).json({ error: "Credenciales incorrectas." });
      }

      // Si las crendenciales son correctas generamos un token JWT para el usuario
      // El token dura 8h y contiene el id, y el rol del usuario.
      // El token esta firmado con el .env JWT_SECRET
      const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      );

      res.json({
        mensaje: "Login correcto",
        token,
        usuario: usuario.toSafeJSON(),
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  },
);

// GET /api/auth/me — devuelve el usuario autenticado
// Lo usa el frontend al recargar la página para comprobar si la sesión sigue siendo válida
// y recuperar los datos del usuario sin tener que hacer un login de nuevo.
router.get("/me", verificarToken, (req, res) => {
  res.json({ usuario: req.usuario });
});

// POST /api/auth/registro
// Verificamos el token y el rol del usuario para permitir o no el registro del usuario (Solo los admin pueden crear usuarios)
// Comprueba que el email no esté ya registrado y si todo va bien crea el usuario.
// El hasheo de contraseñas se hace automaticamente en el beforeCreate de models/usuario.js
router.post(
  "/registro",
  verificarToken,
  verificarRol("admin"),
  [
    // Verificamos todos los campos; Nombre, Email, Contraseña, Rol...
    body("nombre").notEmpty().withMessage("El nombre es obligatorio").trim(),
    body("email").isEmail().withMessage("Email no válido").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Mínimo 6 caracteres"),
    body("rol")
      .isIn(["admin", "tecnico", "empleado"])
      .withMessage("Rol no válido"),
  ],
  async (req, res) => {
    // Si alguno de los campos anteriores falla, salta el error 400
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { nombre, email, password, rol } = req.body;

    try {
      const existe = await Usuario.findOne({ where: { email } });
      if (existe) {
        return (
          res
            // Si el usuario ya existe salta el error 409 (Comprueba que el email esta o no en uso)
            .status(409)
            .json({ error: "Este email ya está registrado." })
        );
      }

      const usuario = await Usuario.create({ nombre, email, password, rol });

      res.status(201).json({
        // Si todo va bien se crea el usuario correctamente
        mensaje: "Usuario creado correctamente",
        usuario: usuario.toSafeJSON(),
      });
    } catch (error) {
      // Si falla por cualquier otro motivo el registro mostramos un error generico
      console.error("Error en registro:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  },
);

module.exports = router;
