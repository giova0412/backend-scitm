import { model, Schema } from "mongoose";

const InventarioSchema = new Schema(
  {
    _id: {
      type: Number,
      alias: 'id_herramienta'
    },
    nombre_herramienta: {
      type: String,
      required: true,
    },
    num_partida: {
      type: Number,
      required: true,
      unique: true,
    },
    numero_serie: {
      type: Number,
      required: true,
    },
    fecha_r: {
      type: Date,
      required: true,
    },
    dep: {
      type: String,
      required: true,
    },
    medida: {
      type: String,
      required: true,
    },
    calibrado: {
      type: Boolean,
      required: false,
      default: false,
    },
    fecha_calibrado:{
      type: Date,
      required: false,
    },
    fecha_pendiente:{
      type: Date,
      required: false,
    },
    // Campos adicionales para calibración
    calibracion_activa: {
      type: Boolean,
      required: false,
      default: false,
    },
    fecha_calibracion: {
      type: Date,
      required: false,
    },
    estado_calibracion: {
      type: String,
      required: false,
      default: 'Pendiente de calibración',
    },
    imagen_url: {
      type: String,
      required: false,
    },
    // Nuevo campo para marcar si la herramienta está prestada
    prestada: {
      type: Boolean,
      required: false,
      default: false,
    }
  }, 
  {
    versionKey: false,
    timestamps: true,
    id: false // Desactiva la virtualización id de Mongoose
  }
);

// Oculta timestamps en la respuesta JSON
InventarioSchema.method("toJSON", function () {
  const { createdAt, updatedAt, ...object } = this.toObject();
  return object;
});

export default model("Inventario", InventarioSchema);

