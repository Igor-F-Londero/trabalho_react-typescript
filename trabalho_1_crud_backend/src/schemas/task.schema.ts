import { z } from 'zod';
import { objectId } from './group.schema.js';
import { PRIORIDADES, STATUS } from '../models/Task.js';

export const createTaskSchema = z.object({
  titulo: z.string().trim().min(3, 'Título deve ter ao menos 3 caracteres').max(120),
  descricao: z.string().trim().max(1000).optional(),
  status: z.enum(STATUS).optional(),
  prioridade: z.enum(PRIORIDADES).optional(),
  prazo: z.coerce.date().optional(),
  grupo: objectId.nullable().optional(),
});

// Atualização parcial: ao menos um campo é obrigatório.
export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Informe ao menos um campo para atualizar');

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
