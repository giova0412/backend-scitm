import { model, Schema } from "mongoose";

const ReportSchema = new Schema({
    _id: {
        type: Number,
        alias: 'ficha_trabajador'
    },
    nombre: {
        required: true,
        type: String,
    },
    id_herramienta: {
        type: [Number], // Ahora es un array de IDs de herramientas
        required: true,
    },
    fecha_recibido: {
        type: Date,
        required: true,
    },
    fecha_entrega: {
        type: Date, 
        required: true,
    },
    
    estado_entrega:{   
        type:String,
        enum:["pendiente","Entregado","No entrega"],
        default:"pendiente",
    }
},
{
    versionKey: false,
    timestamps: true,
    id: false // Desactiva la virtualización id de Mongoose
});

// Oculta timestamps en la respuesta JSON
ReportSchema.method("toJSON", function () {
  const { createdAt, updatedAt, ...object } = this.toObject();
  return object;
});

export default model("reportes", ReportSchema);

