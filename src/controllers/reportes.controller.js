import ReportesDAO from "../dao/reportes.dao.js";
import { createRequire } from 'module';
import { join } from 'path';
import { existsSync } from 'fs';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit-table');
import { Readable } from "stream";

const ReportesController = {};

ReportesController.insert = (req, res) => {
    ReportesDAO.insert(req.body)
        .then((response) => {
            res.json({
                data: {
                    message: "reporte  insertado correctamente",
                    reporte: response
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

ReportesController.getAll = (req, res) => {
    ReportesDAO.getAll()
        .then((reportes) => {
            res.json({
                data: {
                    reportes: reportes
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

ReportesController.getOne = (req, res) => {
    ReportesDAO.getOne(req.params.ficha_trabajador)
        .then((reporte) => {
            res.json({
                data: {
                    reporte: reporte
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

ReportesController.updateOne = (req, res) => {
    ReportesDAO.updateOne(req.body, req.params.ficha_trabajador)
        .then((result) => {
            res.json({
                data: {
                    message: "reporte  actualizado",
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

ReportesController.deleteOne = (req, res) => {
    ReportesDAO.deleteOne(req.params.ficha_trabajador)
        .then((reportesDelete) => {
            res.json({
                data: {
                    message: "reporte  eliminado correctamente",
                    reportes_delete: reportesDelete
                }
            });
        })
        .catch((error) => {
            res.json({
                data: { error: error }
            });
        });
};

ReportesController.downloadPDF = async (req, res) => { 
    try {
        const reportes = await ReportesDAO.getAll();
        
        // Imprimir para depuración
        console.log("Reportes recuperados:", JSON.stringify(reportes, null, 2));
        
        // Verificar explícitamente las fichas de trabajador
        console.log("Valores de ficha_trabajador en reportes:");
        reportes.forEach(r => console.log(`Reporte ID: ${r._id}, ficha_trabajador: ${r.ficha_trabajador || r._id}, tipo: ${typeof r.ficha_trabajador || typeof r._id}`));
        
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Pipe the PDF directly to the response
        doc.pipe(res);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reportes.pdf');

        // Logo (opcional)
        const logoPath = join(process.cwd(), 'src', 'uploads', 'image.png');
        console.log("Ruta del logo:", logoPath);
        console.log("¿Existe el logo?:", existsSync(logoPath));
        
        if (existsSync(logoPath)) {
            doc.image(logoPath, 30, 30, { width: 150, height: 80, fit: [150, 80] });
        } else {
            // Si no hay logo, dibuja un rectángulo
            doc.rect(30, 30, 150, 80).stroke();
            doc.fontSize(10).text('Logo de la empresa', 65, 60);
        }

        // Título
        doc.fontSize(20).text('Reporte de Herramientas', 250, 55, { align: 'center' });

        // Fecha de generación
        doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString()}`, 450, 40);

        // Tabla
        const table = {
            title: "Lista de Herramientas Prestadas", 
            headers: [
                "Ficha Trabajador",
                "Nombre Trabajador",
                "Herramientas",
                "Nombre(s) Herramienta(s)",
                "ID(s) Herramienta",
                "Fecha Recibido",
                "Fecha Entrega",
                "Estado"
            ],
            rows: reportes.map(reporte => [
                String(reporte.ficha_trabajador || reporte._id || 'No disponible'),
                reporte.nombre || 'No disponible',
                (reporte.herramientas && reporte.herramientas.length > 0) ? reporte.herramientas.join(", ") : 'No disponible',
                (Array.isArray(reporte.nombres_herramientas) && reporte.nombres_herramientas.length > 0 && reporte.nombres_herramientas.some(n => n && n !== 'Herramienta no encontrada'))
                  ? reporte.nombres_herramientas.filter(n => n && n !== 'Herramienta no encontrada').join(", ")
                  : (Array.isArray(reporte.id_herramienta) && reporte.id_herramienta.length > 0 ? reporte.id_herramienta.map(id => id).join(", ") : 'No disponible'),
                (reporte.id_herramienta && reporte.id_herramienta.length > 0) ? reporte.id_herramienta.join(", ") : 'No disponible',
                new Date(reporte.fecha_recibido).toLocaleDateString(),
                new Date(reporte.fecha_entrega).toLocaleDateString(),
                reporte.estado_entrega || 'No disponible'
            ])
        };

        // Posicionar la tabla después del logo
        await doc.table(table, {
            x: 30,
            y: 130,
            width: 535,
            divider: {
                header: { disabled: false, width: 2, opacity: 1 },
                horizontal: { disabled: false, width: 1, opacity: 0.5 }
            },
            padding: 5,
            columnSpacing: 5,
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: () => doc.font('Helvetica').fontSize(9)
        });

        // Espacio para firma
        const currentY = doc.y + 30;
        doc.fontSize(12).text('Firma del Encargado:', 30, currentY);
        doc.rect(30, currentY + 20, 200, 60).stroke();
        doc.fontSize(10).text('Nombre y Firma', 100, currentY + 85);

        doc.end();
    } catch (error) {
        console.error('Error al generar PDF:', error);
        res.status(500).json({
            success: false,
            message: "Error al generar PDF",
            error: error.message
        });

    }
};

ReportesController.downloadOnePDF = async (req, res) => {
    try {
        const reporte = await ReportesDAO.getOne(req.params.ficha_trabajador);
        if (!reporte) {
            return res.status(404).json({
                success: false,
                message: "Reporte no encontrado"
            });
        }
        
        // Imprimir para depuración
        console.log("Reporte individual recuperado:", JSON.stringify(reporte, null, 2));
        console.log(`Reporte ID: ${reporte._id}, ficha_trabajador: ${reporte.ficha_trabajador || reporte._id}, tipo: ${typeof reporte.ficha_trabajador || typeof reporte._id}`);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Pipe the PDF directly to the response
        doc.pipe(res);
 
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_${reporte.ficha_trabajador || reporte._id}.pdf`);

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

        // Tabla de datos
        const table = {
            title: "Detalles del Préstamo",
            headers: ["Campo", "Datos"],
            rows: [
                ["Ficha Trabajador", String(reporte.ficha_trabajador || reporte._id || 'No disponible')],
                ["Nombre del Trabajador", reporte.nombre || 'No disponible'],
                ["Nombre de la Herramienta", (Array.isArray(reporte.nombres_herramientas) && reporte.nombres_herramientas.length > 0 && reporte.nombres_herramientas.some(n => n && n !== 'Herramienta no encontrada'))
                  ? reporte.nombres_herramientas.filter(n => n && n !== 'Herramienta no encontrada').join(", ")
                  : (Array.isArray(reporte.id_herramienta) && reporte.id_herramienta.length > 0 ? reporte.id_herramienta.map(id => id).join(", ") : 'No disponible')],
                ["ID de la Herramienta", Array.isArray(reporte.id_herramienta) ? reporte.id_herramienta.join(", ") : String(reporte.id_herramienta || 'No disponible')],
                ["Fecha de Recepción", new Date(reporte.fecha_recibido).toLocaleDateString()],
                ["Fecha de Entrega", new Date(reporte.fecha_entrega).toLocaleDateString()],
                ["Estado de Entrega", reporte.estado_entrega || 'No disponible']
            ]
        };

        // Posicionar la tabla después del logo
        await doc.table(table, {
            x: 30,
            y: 130,
            width: 535,
            divider: {
                header: { disabled: false, width: 2, opacity: 1 },
                horizontal: { disabled: false, width: 1, opacity: 0.5 }
            },
            padding: 5,
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: () => doc.font('Helvetica').fontSize(10)
        });

        // Espacio para firma
        const currentY = doc.y + 30;
        doc.fontSize(12).text('Firma del Encargado:', 30, currentY);
        doc.rect(30, currentY + 20, 200, 60).stroke();
        doc.fontSize(10).text('Nombre y Firma', 100, currentY + 85);

        doc.end();
    } catch (error) {
        console.error('Error al generar PDF individual:', error);
        res.status(500).json({
            success: false,
            message: "Error al generar PDF",
            error: error.message
        });
    }
};

export default ReportesController;