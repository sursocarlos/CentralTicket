const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

// Verifica que el token JWT sea válido
const verificarToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res
      .status(401)
      .json({ error: "Acceso denegado. Token no proporcionado." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Comprueba que el usuario sigue existiendo y activo
    const usuario = await Usuario.findOne({
      where: { id: decoded.id, activo: true },
    });

    if (!usuario) {
      return res
        .status(401)
        .json({ error: "Token inválido. Usuario no encontrado." });
    }

    req.usuario = usuario.toSafeJSON();
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expirado. Inicia sesión de nuevo." });
    }
    return res.status(403).json({ error: "Token inválido." });
  }
};

// Verifica que el usuario tenga el rol necesario
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: "No autenticado." });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(" o ")}.`,
      });
    }
    next();
  };
};

module.exports = { verificarToken, verificarRol };
