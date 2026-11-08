import { Router } from 'express';
import * as controller from '../controllers/group.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';
import { createGroupSchema, updateGroupSchema } from '../schemas/group.schema.js';
import { listGroupsQuerySchema, removeGroupQuerySchema } from '../schemas/query.schema.js';

export const groupRoutes = Router();

// Todas as rotas de grupos exigem login.
groupRoutes.use(authenticate);
groupRoutes.post('/', validateBody(createGroupSchema), controller.create);
groupRoutes.get('/', validateQuery(listGroupsQuerySchema), controller.list);
// '/arvore' vem antes de '/:id', senão "arvore" seria lido como um id.
groupRoutes.get('/arvore', controller.tree);
groupRoutes.get('/:id', controller.getById);
groupRoutes.put('/:id', validateBody(updateGroupSchema), controller.update);
groupRoutes.delete('/:id', validateQuery(removeGroupQuerySchema), controller.remove);
