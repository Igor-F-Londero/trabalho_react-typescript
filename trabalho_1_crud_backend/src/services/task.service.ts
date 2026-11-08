import { isValidObjectId } from 'mongoose';
import { Task } from '../models/Task.js';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema.js';
import type { ListTasksQuery } from '../schemas/query.schema.js';
import { AppError } from '../utils/AppError.js';
import { assertGroupOwned } from './group.service.js';

// Toda busca inclui `usuario`: um usuário nunca acessa tarefas de outro.
function findOwned(id: string, userId: string) {
  if (!isValidObjectId(id)) throw new AppError(400, 'ID inválido');
  return Task.findOne({ _id: id, usuario: userId });
}

async function getOwnedOr404(id: string, userId: string) {
  const task = await findOwned(id, userId);
  if (!task) throw new AppError(404, 'Tarefa não encontrada');
  return task;
}

/** Se a tarefa informar `grupo`, ele precisa ser do mesmo usuário. */
export async function create(data: CreateTaskInput, userId: string) {
  await assertGroupOwned(data.grupo, userId);
  return Task.create({ ...data, usuario: userId });
}

/** Lista paginada das tarefas do usuário, mais recentes primeiro; `grupo=nenhum` filtra as sem grupo. */
export async function list(query: ListTasksQuery, userId: string) {
  const { status, prioridade, grupo, pagina, limite } = query;
  const filter: Pick<ListTasksQuery, 'status' | 'prioridade'> & {
    usuario: string;
    grupo?: string | null;
  } = {
    usuario: userId,
  };
  if (status) filter.status = status;
  if (prioridade) filter.prioridade = prioridade;
  if (grupo === 'nenhum') filter.grupo = null;
  else if (grupo) filter.grupo = grupo;
  const [itens, total] = await Promise.all([
    Task.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite),
    Task.countDocuments(filter),
  ]);
  return { itens, total };
}

export async function getById(id: string, userId: string) {
  return getOwnedOr404(id, userId);
}

export async function update(id: string, userId: string, data: UpdateTaskInput) {
  const task = await getOwnedOr404(id, userId);
  await assertGroupOwned(data.grupo, userId);
  task.set(data);
  await task.save();
  return task;
}

export async function remove(id: string, userId: string) {
  const task = await getOwnedOr404(id, userId);
  await task.deleteOne();
}
