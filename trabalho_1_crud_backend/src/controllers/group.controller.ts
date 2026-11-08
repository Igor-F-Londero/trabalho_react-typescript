import type { RequestHandler } from 'express';
import type { ListGroupsQuery, RemoveGroupQuery } from '../schemas/query.schema.js';
import { setPaginationHeaders } from '../utils/pagination.js';
import * as groupService from '../services/group.service.js';

// `req.userId` vem do `authenticate`; filtros já validados ficam em `res.locals.query`.
export const create: RequestHandler = async (req, res) => {
  res.status(201).json(await groupService.create(req.body, req.userId));
};

export const list: RequestHandler = async (req, res) => {
  const query = res.locals.query as ListGroupsQuery;
  const { itens, total } = await groupService.list(query, req.userId);
  setPaginationHeaders(res, total, query);
  res.json(itens);
};

export const tree: RequestHandler = async (req, res) => {
  res.json(await groupService.tree(req.userId));
};

export const getById: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await groupService.getById(req.params.id, req.userId));
};

export const update: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await groupService.update(req.params.id, req.userId, req.body));
};

export const remove: RequestHandler<{ id: string }> = async (req, res) => {
  const { cascata = false } = res.locals.query as RemoveGroupQuery;
  await groupService.remove(req.params.id, req.userId, cascata);
  res.status(204).send();
};
