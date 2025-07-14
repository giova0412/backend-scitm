import InventarioDAO from "../dao/inventario.dao.js";
import { createRequire } from 'module';
import { join } from 'path';
import { existsSync } from 'fs';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit-table');

const inventarioController = {};

inventarioController.insert = (req, res) => {
    try {
        console.log('Datos recibidos en insert:', req.body);
        console.log('Archivo recibido:', req.file);
        
        // Preparar los datos de la herramienta
        const herramientaData = { ...req.body };
        
        // Asignar el num_partida como _id (ID de la herramienta)
        if (herramientaData.num_partida) {
            herramientaData._id = parseInt(herramientaData.num_partida);
        }
        
        // Si se subió una imagen, agregar la URL
        if (req.file) {
            herramientaData.imagen_url = `/api/inventario/imagen/${req.file.filename}`;
            console.log('URL de imagen agregada:', herramientaData.imagen_url);
        }
        
        console.log('Datos finales a enviar al DAO:', herramientaData);
        
        InventarioDAO.insert(herramientaData)
            .then((response) => {
                console.log('Respuesta del DAO:', response);
                res.json({
                    data: {
                        message: "Herramienta insertada correctamente"
                    }
                });
            })
            .catch((error) => {
                console.error('Error en el DAO:', error);
                res.status(500).json({
                    data: {
                        message: `Error al insertar herramienta: ${error.message}`
                    }
                });
            });
    } catch (error) {
        console.error('Error en el controlador:', error);
        res.status(500).json({
            data: {
                message: "Error al procesar la solicitud"
            }
        });
    }
};

inventarioController.getAll = (req, res) => {
    InventarioDAO.getAll()
        .then((herramientas) => {
            // Asegurar que todas las herramientas tengan la URL completa de la imagen
            const herramientasConImagenes = herramientas.map(herramienta => {
                const herramientaObj = herramienta.toObject ? herramienta.toObject() : herramienta;
                if (herramientaObj.imagen_url && !herramientaObj.imagen_url.startsWith('http')) {
                    // Construir URL completa si no es una URL completa
                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                    herramientaObj.imagen_url = `${baseUrl}${herramientaObj.imagen_url}`;
                }
                return herramientaObj;
            });
            
            res.json({
                data: {
                    herramientas: herramientasConImagenes
                }
            });
        })
        .catch((error) => {
            res.json({
                data: {
                    message: error
                }
            });
        });
};

inventarioController.getOne = (req, res) => {
    InventarioDAO.getOne(req.params.id)
        .then((herramienta) => {
            if (herramienta) {
                const herramientaObj = herramienta.toObject ? herramienta.toObject() : herramienta;
                if (herramientaObj.imagen_url && !herramientaObj.imagen_url.startsWith('http')) {
                    // Construir URL completa si no es una URL completa
                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                    herramientaObj.imagen_url = `${baseUrl}${herramientaObj.imagen_url}`;
                }
                
                res.json({
                    data: {
                        herramienta: herramientaObj
                    }
                });
            } else {
                res.status(404).json({
                    data: {
                        message: "Herramienta no encontrada"
                    }
                });
            }
        })
        .catch((error) => {
            res.json({
                data: {
                    message: error
                }
            });
        });
};

inventarioController.updateOne = (req, res) => {
    InventarioDAO.updateOne(req.body, req.params.id)
        .then((result) => {
            res.json({
                data: {
                    message: "herramienta actualizada",
                    result: result
                }
            });
        })
        .catch((error) => {
            res.json({
                data: { error: error }
            });
        });
};

inventarioController.deleteOne = (req, res) => {
    InventarioDAO.deleteOne(req.params.id)
        .then((inventarioDelete) => {
            res.json({
                data: {
                    message: "herramienta eliminada correctamente",
                    inventario_delete: inventarioDelete
                }
            });
        })
        .catch((error) => {
            res.json({
                data: { error: error }
            });
        });  
   
};

inventarioController.actualizarCalibracion = async (req, res) => {
    try {
        const { calibracion_activa } = req.body;
        const id_herramienta = req.params.id_herramienta;
        const fecha_calibracion = calibracion_activa ? new Date() : null; 
        const estado_calibracion = calibracion_activa ? 'Calibrado' : 'Pendiente de calibración';
 
        const herramientaActualizada = await InventarioDAO.updateOne(
            {
                calibracion_activa,  
                fecha_calibracion,
                estado_calibracion
            },
            id_herramienta
        );

        res.json({
            success: true,
            message: "Estado de calibración actualizado",
            data: herramientaActualizada
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar el estado de calibración", 
            error: error.message
        });
    } 
};

inventarioController.updateImagen = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                data: {
                    message: "No se proporcionó ninguna imagen"
                }
            });
        }

        const imagenUrl = `/api/inventario/imagen/${req.file.filename}`;
        
        InventarioDAO.updateOne({ imagen_url: imagenUrl }, req.params.id)
            .then((result) => {
                res.json({
                    data: {
                        message: "Imagen actualizada correctamente"
                    }
                });
            })
            .catch((error) => {
                res.json({
                    data: {
                        message: error
                    }
                });
            });
    } catch (error) {
        res.status(500).json({
            data: {
                message: "Error al procesar la imagen"
            }
        });
    }
};

// Nueva función para generar PDF individual de herramienta
inventarioController.downloadHerramientaPDF = async (req, res) => {
    try {
        const herramienta = await InventarioDAO.getOne(req.params.id);
        if (!herramienta) {
            return res.status(404).json({
                success: false,
                message: "Herramienta no encontrada"
            });
        }
        
        console.log("Herramienta para PDF:", JSON.stringify(herramienta, null, 2));

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Pipe the PDF directly to the response
        doc.pipe(res);
 
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=herramienta_${herramienta._id}.pdf`);

        // Logo (opcional)
        const logoPath = join(process.cwd(), 'src', 'uploads', 'image.png');
        if (existsSync(logoPath)) {
            doc.image(logoPath, 30, 30, { width: 150, height: 80, fit: [150, 80] });
        } else {
            // Si no hay logo, dibuja un rectángulo
            doc.rect(30, 30, 150, 80).stroke();
            doc.fontSize(10).text('Logo de la empresa', 65, 60);
        }

        // Título
        doc.fontSize(20).text('Reporte Individual de Herramienta', 250, 55, { align: 'center' });

        // Fecha de generación
        doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString()}`, 450, 40);

        // Imagen de la herramienta (si existe)
        let currentY = 130;
        if (herramienta.imagen_url) {
            try {
                // Extraer el nombre del archivo de la URL
                const imagePath = join(process.cwd(), 'src', 'uploads', herramienta.imagen_url.split('/').pop());
                if (existsSync(imagePath)) {
                    doc.image(imagePath, 30, currentY, { width: 150, height: 150, fit: [150, 150] });
                    currentY += 170; // Espacio después de la imagen
                }
            } catch (error) {
                console.log('Error al cargar imagen:', error);
            }
        }

        // Tabla de datos de la herramienta
        const table = {
            title: "Información de la Herramienta",
            headers: ["Campo", "Datos"],
            rows: [
                ["ID de Herramienta", String(herramienta._id || 'No disponible')],
                ["Nombre de la Herramienta", herramienta.nombre_herramienta || 'No disponible'],
                ["Número de Partida", String(herramienta.num_partida || 'No disponible')],
                ["Número de Serie", String(herramienta.numero_serie || 'No disponible')],
                ["Fecha de Registro", herramienta.fecha_r ? new Date(herramienta.fecha_r).toLocaleDateString() : 'No disponible'],
                ["Departamento", herramienta.dep || 'No disponible'],
                ["Medida", herramienta.medida || 'No disponible'],
                ["Estado de Calibración", herramienta.estado_calibracion || 'Pendiente de calibración'],
                ["Calibración Activa", herramienta.calibracion_activa ? 'Sí' : 'No'],
                ["Calibrado", herramienta.calibrado ? 'Sí' : 'No']
            ]
        };

        // Agregar fecha de calibración si existe
        if (herramienta.fecha_calibracion) {
            table.rows.push(["Fecha de Calibración", new Date(herramienta.fecha_calibracion).toLocaleDateString()]);
        }

        // Posicionar la tabla después de la imagen
        await doc.table(table, {
            x: 30,
            y: currentY,
            width: 535,
            divider: {
                header: { disabled: false, width: 2, opacity: 1 },
                horizontal: { disabled: false, width: 1, opacity: 0.5 }
            },
            padding: 5,
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: () => doc.font('Helvetica').fontSize(9)
        });

        // Espacio para firma
        const signatureY = doc.y + 30;
        doc.fontSize(12).text('Firma del Encargado:', 30, signatureY);
        doc.rect(30, signatureY + 20, 200, 60).stroke();
        doc.fontSize(10).text('Nombre y Firma', 100, signatureY + 85);

        doc.end();
    } catch (error) {
        console.error('Error al generar PDF de herramienta:', error);
        res.status(500).json({
            success: false,
            message: "Error al generar PDF",
            error: error.message
        });
    }
};

export default inventarioController;   