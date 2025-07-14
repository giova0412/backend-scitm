import { Router } from "express";
import ReportesController from "../controllers/reportes.controller.js";

const router = Router();

router.post("/", ReportesController.insert);
router.get("/reportesAll", ReportesController.getAll);
router.get("/downloadPDF", ReportesController.downloadPDF);
// Nueva ruta para descargar un solo reporte en PDF
router.get("/downloadPDF/:ficha_trabajador", ReportesController.downloadOnePDF);
router.get("/:ficha_trabajador", ReportesController.getOne);
router.put("/updateOne/:ficha_trabajador", ReportesController.updateOne);
router.delete("/deleteOne/:ficha_trabajador", ReportesController.deleteOne);

export default router;
