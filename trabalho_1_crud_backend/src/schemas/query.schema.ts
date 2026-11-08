import { z } from 'zod';
import { PRIORIDADES, STATUS } from '../models/Task.js';
import { objectId } from './group.schema.js';

// Paginação comum às listagens: ?pagina=1&limite=20 (limite máximo 100).
export const LIMITE_PADRAO = 20;
export const LIMITE_MAXIMO = 100;
const paginacao = {
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(LIMITE_MAXIMO).default(LIMITE_PADRAO),
};

// Filtros da URL (?pai=, ?status= ...) chegam como string; aqui são validados antes do controller.
export const listGroupsQuerySchema = z.object({
  pai: z.union([z.literal('raiz'), objectId]).optional(),
  ...paginacao,
});

export const removeGroupQuerySchema = z.object({
  cascata: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const listTasksQuerySchema = z.object({
  status: z.enum(STATUS).optional(),
  prioridade: z.enum(PRIORIDADES).optional(),
  grupo: z.union([z.literal('nenhum'), objectId]).optional(),
  ...paginacao,
});

// Resumo mensal: ?ano=2026 limita o resumo a um ano; sem o parâmetro considera todas as tarefas com prazo.
export const monthlySummaryQuerySchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;
export type RemoveGroupQuery = z.infer<typeof removeGroupQuerySchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type MonthlySummaryQuery = z.infer<typeof monthlySummaryQuerySchema>;
