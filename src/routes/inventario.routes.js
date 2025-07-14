import { Router } from "express";
import inventarioController from "../controllers/inventario.Controller.js";
import upload from "../middlewares/upload.middleware.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get("/", inventarioController.getAll);
router.get("/:id", inventarioController.getOne);
router.post("/", upload.single('imagen'), inventarioController.insert);
router.put("/:id", inventarioController.updateOne);
router.put("/:id/imagen", upload.single('imagen'), inventarioController.updateImagen);
router.delete("/:id", inventarioController.deleteOne);

// Ruta para servir imágenes
router.get("/imagen/:filename", (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads', filename);
    res.sendFile(imagePath);
});

// Rutas para calibración
router.put('/calibracion/:id_herramienta', inventarioController.actualizarCalibracion);

// Ruta para descargar PDF individual de herramienta
router.get('/pdf/:id', inventarioController.downloadHerramientaPDF);

export default router;
