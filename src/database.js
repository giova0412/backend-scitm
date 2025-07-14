//conexion ala base de datos
import mongoose,{mongo} from "mongoose";
mongoose.connect('mongodb+srv://pemexmetro580:metrologia1*3@clustermetro.jpdlrc4.mongodb.net/TallerMetro?retryWrites=true&w=majority&appName=ClusterMetro')
.then((db)=>console.log('conexion a mongo lista 👍'))
.catch((error)=>console.error(error));
export default mongoose;