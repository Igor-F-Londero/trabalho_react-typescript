import { Schema, model } from 'mongoose';

// Valores aceitos, compartilhados com a validação Zod e o Swagger.
export const STATUS = ['pendente', 'em_andamento', 'concluida'] as const;
export const PRIORIDADES = ['baixa', 'media', 'alta'] as const;

// `grupo` é opcional (null = tarefa solta); `usuario` é o dono.
const taskSchema = new Schema(
  {
    titulo: { type: String, required: true, trim: true },
    descricao: { type: String, trim: true, default: '' },
    status: { type: String, enum: STATUS, default: 'pendente' },
    prioridade: { type: String, enum: PRIORIDADES, default: 'media' },
    prazo: { type: Date },
    grupo: { type: Schema.Types.ObjectId, ref: 'Group', default: null, index: true },
    usuario: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

export const Task = model('Task', taskSchema);
