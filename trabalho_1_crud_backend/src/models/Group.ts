import { Schema, model } from 'mongoose';

// `pai` aponta para outro grupo (null = raiz), formando a hierarquia com profundidade livre.
// `usuario` é o dono; todas as consultas filtram por ele.
const groupSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    pai: { type: Schema.Types.ObjectId, ref: 'Group', default: null, index: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

export const Group = model('Group', groupSchema);
