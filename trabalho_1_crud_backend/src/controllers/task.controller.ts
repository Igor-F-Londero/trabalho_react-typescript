import type { RequestHandler } from 'express';
import type { ListTasksQuery, MonthlySummaryQuery } from '../schemas/query.schema.js';
import * as summaryService from '../services/summary.service.js';
import { setPaginationHeaders } from '../utils/pagination.js';
import * as taskService from '../services/task.service.js';

// `req.userId` vem do `authenticate`; filtros já validados ficam em `res.locals.query`.
export const create: RequestHandler = async (req, res) => {
  res.status(201).json(await taskService.create(req.body, req.userId));
};

export const list: RequestHandler = async (req, res) => {
  const query = res.locals.query as ListTasksQuery;
  const { itens, total } = await taskService.list(query, req.userId);
  setPaginationHeaders(res, total, query);
  res.json(itens);
};

export const monthlySummary: RequestHandler = async (req, res) => {
  res.json(await summaryService.monthly(res.locals.query as MonthlySummaryQuery, req.userId));
};

export const getById: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await taskService.getById(req.params.id, req.userId));
};

export const update: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await taskService.update(req.params.id, req.userId, req.body));
};

export const remove: RequestHandler<{ id: string }> = async (req, res) => {
  await taskService.remove(req.params.id, req.userId);
  res.status(204).send();
};
