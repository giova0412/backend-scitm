import reportes from "../model/reportes.m.js";
import Inventario from "../model/inventario.m.js"; // Importa el modelo de inventario

const ReportesDAO = {};

// Insertar reporte y devolver también los nombres de las herramientas
ReportesDAO.insert = async (data) => {
    data._id = data.ficha_trabajador || data._id;

    // Buscar si ya existe un reporte pendiente para el trabajador
    let reporteExistente = await reportes.findOne({
        _id: data._id,
        estado_entrega: 'pendiente'
    });

    let reporteFinal;
    let herramientasAActualizar = [];
    if (reporteExistente) {
        // Unir las herramientas existentes con la(s) nueva(s) sin duplicados
        let nuevasHerramientas = Array.isArray(data.id_herramienta) ? data.id_herramienta : [data.id_herramienta];
        let herramientasActualizadas = Array.from(new Set([...(reporteExistente.id_herramienta || []), ...nuevasHerramientas]));
        // Actualizar el reporte existente
        await reportes.updateOne({ _id: data._id, estado_entrega: 'pendiente' }, {
            ...data,
            id_herramienta: herramientasActualizadas
        });
        reporteFinal = await reportes.findOne({ _id: data._id, estado_entrega: 'pendiente' });
        herramientasAActualizar = herramientasActualizadas;
    } else {
        // Si no existe, crearlo
        reporteFinal = await reportes.create(data);
        herramientasAActualizar = Array.isArray(data.id_herramienta) ? data.id_herramienta : [data.id_herramienta];
    }

    // Marcar herramientas como prestadas
    await Inventario.updateMany(
      { _id: { $in: herramientasAActualizar } },
      { $set: { prestada: true } }
    );

    // Buscar todas las herramientas asociadas
    const herramientas = await Inventario.find({ _id: { $in: reporteFinal.id_herramienta } });
    const nombresHerramientas = herramientas.map(h => h.nombre_herramienta);
    const reporteObj = reporteFinal.toObject();
    reporteObj.nombres_herramientas = nombresHerramientas;
    return reporteObj;
};

// Obtener un reporte por ficha_trabajador y agregar nombres de herramientas
ReportesDAO.getOne = async (ficha_trabajador) => {
    try {
        console.log(`Buscando reporte con ficha_trabajador: ${ficha_trabajador}`);
        const reporte = await reportes.findById(ficha_trabajador);
        
        if (!reporte) {
            console.log(`No se encontró reporte con ficha_trabajador: ${ficha_trabajador}`);
            return null;
        }
        
        console.log(`Reporte encontrado:`, JSON.stringify(reporte, null, 2));
        console.log(`Buscando herramientas con id_herramienta: ${reporte.id_herramienta}`);
        
        // Buscar todas las herramientas asociadas
        const herramientas = await Inventario.find({ _id: { $in: reporte.id_herramienta } });
        const nombresHerramientas = herramientas.map(h => h.nombre_herramienta);
        
        console.log("Herramientas encontradas:", JSON.stringify(herramientas, null, 2));
        
        const reporteObj = reporte.toObject();
        reporteObj.nombres_herramientas = nombresHerramientas;
        
        console.log("Reporte completo a devolver:", JSON.stringify(reporteObj, null, 2));
        return reporteObj;
    } catch (error) {
        console.error("Error en getOne:", error);
        throw error;
    }
};

// Obtener todos los reportes y agregar nombres de herramientas a cada uno
ReportesDAO.getAll = async () => {
    try {
        console.log("Obteniendo todos los reportes...");
        const reportesList = await reportes.find();
        console.log(`Se encontraron ${reportesList.length} reportes`);
        
        console.log("Obteniendo todas las herramientas...");
        const herramientas = await Inventario.find();
        console.log(`Se encontraron ${herramientas.length} herramientas`);
        
        // Crear un mapa de id_herramienta -> nombre_herramienta (usando string para evitar problemas de tipo)
        const herramientasMap = {};
        herramientas.forEach(h => {
            herramientasMap[String(h._id)] = h.nombre_herramienta;
        });
        
        // Crear un array para almacenar los reportes con información de herramientas
        const reportesConHerramientas = [];
        
        // Procesar cada reporte
        for (const reporte of reportesList) {
            const obj = reporte.toObject();
            // Mapear los nombres de todas las herramientas asociadas (comparando como string)
            obj.nombres_herramientas = (reporte.id_herramienta || []).map(id => herramientasMap[String(id)] || "Herramienta no encontrada");
            reportesConHerramientas.push(obj);
        }
        
        console.log("Reportes procesados:", JSON.stringify(reportesConHerramientas, null, 2));
        return reportesConHerramientas;
    } catch (error) {
        console.error("Error en getAll:", error);
        throw error;
    }
};

ReportesDAO.updateOne = async (data, ficha_trabajador) => {
    // Evitar intentar actualizar el _id
    if (data._id) delete data._id;
    if (data.ficha_trabajador) delete data.ficha_trabajador;

    // Buscar el reporte previo para saber qué herramientas tenía antes
    const reportePrevio = await reportes.findById(ficha_trabajador);
    const herramientasPrevias = reportePrevio && reportePrevio.id_herramienta ? reportePrevio.id_herramienta : [];

    // Si el estado_entrega es "Entregado", actualizar la fecha de entrega y liberar todas las herramientas previas
    if (data.estado_entrega === "Entregado") {
        data.fecha_entrega = new Date(); // Siempre usar la fecha actual
        if (herramientasPrevias.length > 0) {
            await Inventario.updateMany(
                { _id: { $in: herramientasPrevias } },
                { $set: { prestada: false } }
            );
        }
    }

    // Si el estado_entrega es "pendiente", marcar como prestadas las herramientas actuales
    if (data.estado_entrega === "pendiente" && data.id_herramienta && data.id_herramienta.length > 0) {
        await Inventario.updateMany(
            { _id: { $in: data.id_herramienta } },
            { $set: { prestada: true } }
        );
    }

    const reporteActualizado = await reportes.findByIdAndUpdate(ficha_trabajador, data, { new: true });

    if (reporteActualizado) {
        const herramientas = await Inventario.find({ _id: { $in: reporteActualizado.id_herramienta } });
        const nombresHerramientas = herramientas.map(h => h.nombre_herramienta);
        const reporteObj = reporteActualizado.toObject();
        reporteObj.nombres_herramientas = nombresHerramientas;
        return reporteObj;
    }

    return reporteActualizado;
};

ReportesDAO.deleteOne = async (ficha_trabajador) => {
    // Antes de eliminar, buscar el reporte y marcar herramientas como disponibles
    const reporte = await reportes.findById(ficha_trabajador);
    if (reporte && reporte.id_herramienta && reporte.id_herramienta.length > 0) {
        await Inventario.updateMany(
            { _id: { $in: reporte.id_herramienta } },
            { $set: { prestada: false } }
        );
    }
    return await reportes.findByIdAndDelete(ficha_trabajador);
};

export default ReportesDAO;


