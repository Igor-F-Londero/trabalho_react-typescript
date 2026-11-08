import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

/** ID do MongoDB válido; reaproveitado nos schemas de grupo, tarefa e query. */
export const objectId = z.string().refine(isValidObjectId, 'ID inválido');

export const createGroupSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres').max(80),
  pai: objectId.nullable().optional(),
});

// Atualização é parcial: todos os campos opcionais, mas ao menos um deve ser enviado.
export const updateGroupSchema = createGroupSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Informe ao menos um campo para atualizar');

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
