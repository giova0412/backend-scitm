//Aqui arrancamos el servidor
import app from "./app.js"
import "./database.js"

import dotenv from "dotenv";
import path from "path";

// Carga robusta del .env
if (process.env.DOTENV_PATH) {
  dotenv.config({ path: process.env.DOTENV_PATH });
  console.log('Cargando .env desde:', process.env.DOTENV_PATH);
} else {
  dotenv.config();
  console.log('Cargando .env por defecto');
}

const PORT = app.get('port');

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
}).on('error', (error) => {
    console.error('Error al iniciar el servidor:', error);
}); 