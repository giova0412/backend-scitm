import loginDAO from "../dao/login.dao.js";
import { generarTokenRecuperacion } from "../utils/token.js";
import { verificarToken } from "../utils/token.js";
import { enviarCorreoRecuperacion } from "../services/emailSennder.js";

const loginController = {};

loginController.register = (req, res) => {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
        return res.status(400).json({ message: "Faltan campos requeridos 😫" });
    }
    loginDAO.findByNombre(nombre)
        .then((existingUser) => {
            if (existingUser) {
                res.status(400).json({ message: "El usuario ya existe 😥" });
                return null;
            }
            return loginDAO.insert({ nombre, email, password });
        })
        .then((user) => {
            if (user) {
                res.status(201).json({ message: "Usuario registrado exitosamente 😎", user });
            }
        })
        .catch((error) => {
            if (!res.headersSent) {
                res.status(500).json({ message: error.message });
            }
        });
};

loginController.login = (req, res) => {
    const { nombre, password } = req.body;
    if (!nombre || !password) {
        return res.status(400).json({ message: "Faltan campos requeridos 😑" });
    }
    loginDAO.findByNombre(nombre)
        .then((user) => {
            if (!user || user.password !== password) {
                res.status(401).json({ message: "Credenciales inválidas 🙄" });
                return null;
            }
            // Marcar sesión como abierta
            return loginDAO.setSesionAbierta(user._id, true).then(() => user);
        })
        .then((user) => {
            if (user) {
                res.json({ message: "Inicio de sesión exitoso 😁", user: { id: user._id, nombre: user.nombre } });
            }
        })
        .catch((error) => {
            if (!res.headersSent) {
                res.status(500).json({ message: error.message });
            }
        });
};

loginController.logout = (req, res) => {
    const { nombre } = req.body;
    if (!nombre) {
        return res.status(400).json({ message: "Falta el nombre de usuario 😥" });
    }
    loginDAO.findByNombre(nombre)
        .then((user) => {
            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado 😥" });
            }   
            // Marcar sesión como cerrada
            return loginDAO.setSesionAbierta(user._id, false).then(() => {
                res.json({ message: "Sesión cerrada exitosamente 👍" });
            });
        })
        .catch((error) => {
            res.status(500).json({ message: error.message });
        });
};

loginController.recuperarPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Falta el email" });

  try {
    const user = await loginDAO.findByEmail(email);
    if (!user) return res.status(404).json({ message: "No existe una cuenta con ese correo" });

    // Enviar la contraseña en texto plano al correo
    await enviarCorreoRecuperacion(email, null, user.password, user.nombre);
    res.json({ message: "Tu contraseña ha sido enviada a tu correo" });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: "Error al procesar la solicitud" });
    }
  }
};

loginController.resetPassword = async (req, res) => {
  // Solo requiere email y newPassword
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ message: "Faltan datos" });
  try {
    const user = await loginDAO.findByEmail(email);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Contraseña restablecida exitosamente" });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export default loginController;
