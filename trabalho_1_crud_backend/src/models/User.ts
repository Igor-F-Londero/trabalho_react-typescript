import { Schema, model } from 'mongoose';

// `email` é único e sempre minúsculo; `senha` guarda apenas o hash do bcrypt.
const userSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senha: { type: String, required: true },
  },
  { timestamps: true },
);

export const User = model('User', userSchema);
