import Inventario from "../model/inventario.m.js";

const InventarioDAO = {};

InventarioDAO.insert = async (herramienta) => {
    try {
        // Preparar los datos de la herramienta
        const herramientaData = { ...herramienta };
        
        // Usar el ID que proporciona el usuario
        if (herramientaData.id_herramienta && !herramientaData._id) {
            herramientaData._id = herramientaData.id_herramienta;
        }
        
        // Verificar que se proporcione un ID
        if (!herramientaData._id) {
            throw new Error('Se debe proporcionar un ID para la herramienta');
        }
        
        // Asegurar que las fechas sean objetos Datei
        if (herramientaData.fecha_r && typeof herramientaData.fecha_r === 'string') {
            herramientaData.fecha_r = new Date(herramientaData.fecha_r);
        }
        if (herramientaData.fecha_calibrado && typeof herramientaData.fecha_calibrado === 'string') {
            herramientaData.fecha_calibrado = new Date(herramientaData.fecha_calibrado);
        }
        if (herramientaData.fecha_pendiente && typeof herramientaData.fecha_pendiente === 'string') {
            herramientaData.fecha_pendiente = new Date(herramientaData.fecha_pendiente);
        }
        
        // Convertir calibrado a boolean si es string
        if (typeof herramientaData.calibrado === 'string') {
            herramientaData.calibrado = herramientaData.calibrado === 'true';
        }
        
        // Convertir num_partida y numero_serie a números si son strings
        if (typeof herramientaData.num_partida === 'string') {
            herramientaData.num_partida = parseInt(herramientaData.num_partida);
        }
        if (typeof herramientaData.numero_serie === 'string') {
            herramientaData.numero_serie = parseInt(herramientaData.numero_serie);
        }
        
        console.log('Datos a insertar:', herramientaData);
        
        const nuevaHerramienta = await Inventario.create(herramientaData);
        console.log('Herramienta insertada:', nuevaHerramienta);
        
        return nuevaHerramienta;
    } catch (error) {
        console.error('Error al insertar herramienta:', error);
        throw error;
    }
};

InventarioDAO.getAll = async () => {
    // Obtener todas las herramientas
    const herramientas = await Inventario.find();

    // Obtener todos los reportes pendientes
    const Reportes = (await import('./reportes.dao.js')).default;
    const reportesPendientes = await Reportes.getAll();
    // Crear un set con los IDs de herramientas que tienen reporte pendiente
    const idsPrestadasPorReporte = new Set();
    for (const reporte of reportesPendientes) {
        if (reporte.estado_entrega === 'pendiente' && Array.isArray(reporte.id_herramienta)) {
            reporte.id_herramienta.forEach(id => idsPrestadasPorReporte.add(id));
        }
    }

    // Marcar como prestadas las herramientas que tengan reporte pendiente
    const herramientasMarcadas = herramientas.map(h => {
        const obj = h.toObject ? h.toObject() : h;
        if (idsPrestadasPorReporte.has(obj._id)) {
            obj.prestado = true;
        }
        return obj;
    });

    return herramientasMarcadas;
};

InventarioDAO.getOne = async (id_herramienta) => {
    return await Inventario.findById(id_herramienta);
};

InventarioDAO.updateOne = async (inventarioData, id_herramienta) => {
    // Evitar intentar actualizar el _id
    if (inventarioData._id) delete inventarioData._id;
    if (inventarioData.id_herramienta) delete inventarioData.id_herramienta;
    
    return await Inventario.findByIdAndUpdate(id_herramienta, inventarioData, { new: true });
};

InventarioDAO.deleteOne = async (id_herramienta) => {
    return await Inventario.findByIdAndDelete(id_herramienta);
};

InventarioDAO.actualizarCalibracion = (id_herramienta, datos) => {
    return new Promise(async (resolve, reject) => {
        try {
            const herramientaActualizada = await Inventario.findByIdAndUpdate(
                id_herramienta,
                {
                    $set: {
                        calibracion_activa: datos.calibracion_activa,
                        fecha_calibracion: new Date(),
                        estado_calibracion: datos.estado_calibracion
                    }
                },
                { new: true }
            );

            if (!herramientaActualizada) {
                reject("No se encontró la herramienta para actualizar");
                return;
            }

            resolve(herramientaActualizada);
        } catch (error) {
            reject(error);
        }
    });
};

InventarioDAO.obtenerReporteCalibración = (id_herramienta) => {
    return new Promise(async (resolve, reject) => {
        try {
            const herramienta = await Inventario.findById(id_herramienta);
            
            if (!herramienta) {
                reject("Herramienta no encontrada");
                return;
            }

            resolve(herramienta);
        } catch (error) {
            reject(error);
        }
    });
};

export default InventarioDAO;



