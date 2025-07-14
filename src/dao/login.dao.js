import Login from "../model/login.m.js";
const loginDAO = {};

loginDAO.getAll = async () => {
    return await Login.find();
};

loginDAO.findByNombre = async (nombre) => {
    return await Login.findOne({ nombre: nombre });
};

loginDAO.findByEmail = async (email) => {
    return await Login.findOne({ email: email });
};

loginDAO.insert = async (user) => {
    // Verifica que el email no exista
    const existingEmail = await loginDAO.findByEmail(user.email);
    if (existingEmail) {
        throw new Error("El email ya está registrado");
    }
    return await Login.create(user);
};

loginDAO.setSesionAbierta = async (id, estado) => {
    return await Login.findByIdAndUpdate(id, { sesionAbierta: estado });
};
loginDAO.findById = async (id) => {
    return await Login.findById(id);
  };
  
export default loginDAO;
