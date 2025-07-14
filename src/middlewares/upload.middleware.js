import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cloudinary from './cloudinary.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de almacenamiento local solo para image.png
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

// Filtro para tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  }
});

// Middleware para procesar la imagen después de subir
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return next();
    // Si el archivo es image.png, no lo subas a Cloudinary
    if (req.file.originalname === 'image.png') {
      return next();
    }
    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'uploads',
      public_id: uuidv4(),
    });
    // Elimina el archivo local después de subir
    fs.unlinkSync(req.file.path);
    // Guarda la URL de Cloudinary en la request para usarla después
    req.file.cloudinaryUrl = result.secure_url;
    next();
  } catch (error) {
    next(error);
  }
};

export default upload;