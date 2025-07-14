import { model, Schema } from "mongoose";

const LoginSchema = new Schema(
  {
    nombre: {
      required: true, 
      type: String,
    },
    email: {
      required: true,
      unique: true,
      type: String,
    },
    password: {
      required: true,
      type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    active: {
      type: Boolean,
      default: true
    },
    sesionAbierta: {
      type: Boolean,
      default: false
    }
  },
  {
    versionKey: false,
    timestamps: true, 
  }
);

export default model("Login", LoginSchema);