import { Router } from 'express';
import * as controller from '../controllers/task.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';
import { listTasksQuerySchema, monthlySummaryQuerySchema } from '../schemas/query.schema.js';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.js';

export const taskRoutes = Router();

// Todas as rotas de tarefas exigem login.
taskRoutes.use(authenticate);
taskRoutes.post('/', validateBody(createTaskSchema), controller.create);
taskRoutes.get('/', validateQuery(listTasksQuerySchema), controller.list);
// Deve vir antes de '/:id', senão "resumo-mensal" seria tratado como um ID.
taskRoutes.get(
  '/resumo-mensal',
  validateQuery(monthlySummaryQuerySchema),
  controller.monthlySummary,
);
taskRoutes.get('/:id', controller.getById);
taskRoutes.put('/:id', validateBody(updateTaskSchema), controller.update);
taskRoutes.delete('/:id', controller.remove);
