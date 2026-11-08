import { Types, isValidObjectId } from 'mongoose';
import { Group } from '../models/Group.js';
import { Task } from '../models/Task.js';
import type { CreateGroupInput, UpdateGroupInput } from '../schemas/group.schema.js';
import type { ListGroupsQuery } from '../schemas/query.schema.js';
import { AppError } from '../utils/AppError.js';

/** Garante que o grupo existe e é do usuário (404 caso contrário); `null`/`undefined` é aceito (sem grupo). */
export async function assertGroupOwned(id: string | null | undefined, userId: string) {
  if (!id) return;
  if (!(await Group.exists({ _id: id, usuario: userId }))) {
    throw new AppError(404, 'Grupo não encontrado');
  }
}

/** Busca um grupo do usuário ou lança 400 (ID malformado) / 404. Outro usuário também recebe 404. */
export async function getOwnedOr404(id: string, userId: string) {
  if (!isValidObjectId(id)) throw new AppError(400, 'ID inválido');
  const group = await Group.findOne({ _id: id, usuario: userId });
  if (!group) throw new AppError(404, 'Grupo não encontrado');
  return group;
}

/** Profundidade máxima da hierarquia (grupo raiz = nível 1). */
export const MAX_PROFUNDIDADE = 10;

/** Percorre a hierarquia a partir do grupo `id` com um único $graphLookup, sempre restrito aos grupos do usuário. */
async function percorrer<T>(
  id: string,
  userId: string,
  sentido: { connectFromField: string; connectToField: string; depthField?: string },
) {
  const usuario = new Types.ObjectId(userId);
  const [res] = await Group.aggregate<{ achados: T[] }>([
    { $match: { _id: new Types.ObjectId(id), usuario } },
    {
      $graphLookup: {
        from: Group.collection.name,
        startWith: '$_id',
        as: 'achados',
        restrictSearchWithMatch: { usuario },
        ...sentido,
      },
    },
  ]);
  return res?.achados ?? [];
}

/** Nível do grupo na árvore (raiz = 1), subindo pelos `pai`. */
async function depthOf(id: string, userId: string) {
  const cadeia = await percorrer<unknown>(id, userId, {
    connectFromField: 'pai',
    connectToField: '_id',
  });
  return cadeia.length;
}

/** IDs do grupo e de todos os seus descendentes, e quantos níveis existem abaixo dele. */
async function subtreeOf(rootId: string, userId: string) {
  const desc = await percorrer<{ _id: Types.ObjectId; nivel: number }>(rootId, userId, {
    connectFromField: '_id',
    connectToField: 'pai',
    depthField: 'nivel',
  });
  return {
    ids: [rootId, ...desc.map((d) => String(d._id))],
    // `nivel` 0 = filhos diretos, então a altura é o maior nível + 1.
    altura: desc.length ? Math.max(...desc.map((d) => d.nivel)) + 1 : 0,
  };
}

function assertDepth(profundidade: number) {
  if (profundidade > MAX_PROFUNDIDADE) {
    throw new AppError(400, `A hierarquia de grupos aceita no máximo ${MAX_PROFUNDIDADE} níveis`);
  }
}

/**
 * Revalida o posicionamento depois de gravar. A checagem prévia é sequencial e duas requisições
 * simultâneas podem passar por ela (ex.: A→dentro de B e B→dentro de A); a que gravar por último
 * enxerga o estado do banco com o conflito e desfaz o próprio movimento.
 */
async function placementIsValid(id: string, pai: string | null, userId: string) {
  if (!pai) return true;
  const { ids, altura } = await subtreeOf(id, userId);
  if (ids.includes(pai)) return false;
  return (await depthOf(pai, userId)) + 1 + altura <= MAX_PROFUNDIDADE;
}

const CONFLITO = 'Conflito com outra alteração simultânea na hierarquia. Tente novamente.';

export async function create(data: CreateGroupInput, userId: string) {
  await assertGroupOwned(data.pai, userId);
  if (data.pai) assertDepth((await depthOf(data.pai, userId)) + 1);
  const group = await Group.create({ ...data, usuario: userId });
  if (!(await placementIsValid(group.id, data.pai ?? null, userId))) {
    await group.deleteOne();
    throw new AppError(409, CONFLITO);
  }
  return group;
}

export async function list(query: ListGroupsQuery, userId: string) {
  const { pai, pagina, limite } = query;
  const filter: { usuario: string; pai?: string | null } = { usuario: userId };
  if (pai === 'raiz') filter.pai = null;
  else if (pai) filter.pai = pai;
  const [itens, total] = await Promise.all([
    Group.find(filter)
      .sort({ nome: 1, _id: 1 })
      .skip((pagina - 1) * limite)
      .limit(limite),
    Group.countDocuments(filter),
  ]);
  return { itens, total };
}

/** Árvore completa: 2 queries e montagem em memória, evitando uma query por grupo (N+1). */
export async function tree(userId: string) {
  const [groups, tasks] = await Promise.all([
    Group.find({ usuario: userId }).sort({ nome: 1 }).lean(),
    Task.find({ usuario: userId }).sort({ createdAt: -1 }).lean(),
  ]);
  type Node = (typeof groups)[number] & { subgrupos: Node[]; tarefas: typeof tasks };
  const nodes = new Map<string, Node>();
  for (const g of groups) nodes.set(String(g._id), { ...g, subgrupos: [], tarefas: [] });

  const roots: Node[] = [];
  for (const node of nodes.values()) {
    const parent = node.pai ? nodes.get(String(node.pai)) : undefined;
    (parent ? parent.subgrupos : roots).push(node);
  }
  const semGrupo: typeof tasks = [];
  for (const t of tasks) {
    const node = t.grupo ? nodes.get(String(t.grupo)) : undefined;
    (node ? node.tarefas : semGrupo).push(t);
  }
  return { grupos: roots, tarefasSemGrupo: semGrupo };
}

/** Grupo com filhos diretos e tarefas. */
export async function getById(id: string, userId: string) {
  const group = await getOwnedOr404(id, userId);
  const [subgrupos, tarefas] = await Promise.all([
    Group.find({ pai: group._id, usuario: userId }).sort({ nome: 1 }),
    Task.find({ grupo: group._id, usuario: userId }).sort({ createdAt: -1 }),
  ]);
  return { ...group.toJSON(), subgrupos, tarefas };
}

/** Renomeia e/ou move o grupo, recusando mover para dentro de si mesmo ou de um descendente. */
export async function update(id: string, userId: string, data: UpdateGroupInput) {
  const group = await getOwnedOr404(id, userId);
  const { pai } = data;
  if (pai !== undefined && pai !== null) {
    await assertGroupOwned(pai, userId);
    const { ids, altura } = await subtreeOf(group.id, userId);
    // Mover para dentro de si mesmo ou de um descendente criaria um ciclo.
    if (ids.includes(pai)) {
      throw new AppError(
        400,
        'Um grupo não pode ser movido para dentro de si mesmo ou de seus subgrupos',
      );
    }
    // A subárvore inteira desce junto: o nível mais fundo não pode estourar o limite.
    assertDepth((await depthOf(pai, userId)) + 1 + altura);
  }
  const paiAnterior = group.pai ? String(group.pai) : null;
  group.set(data);
  await group.save();
  if (pai && !(await placementIsValid(group.id, pai, userId))) {
    // Reverte só se o `pai` ainda for o que gravamos (outra requisição pode já ter mexido nele).
    await Group.updateOne({ _id: group._id, pai }, { pai: paiAnterior });
    throw new AppError(409, CONFLITO);
  }
  return group;
}

/** Sem `cascata`, recusa (409) se houver subgrupos ou tarefas; com `cascata`, apaga a subárvore inteira. */
export async function remove(id: string, userId: string, cascata: boolean) {
  const group = await getOwnedOr404(id, userId);
  const { ids } = await subtreeOf(group.id, userId);

  if (!cascata) {
    const [subgrupos, tarefas] = await Promise.all([
      Group.countDocuments({ pai: group._id, usuario: userId }),
      Task.countDocuments({ grupo: { $in: ids } }),
    ]);
    if (subgrupos || tarefas) {
      throw new AppError(
        409,
        'Grupo não está vazio. Use ?cascata=true para excluir subgrupos e tarefas.',
        {
          subgrupos,
          tarefas,
        },
      );
    }
  }
  await Task.deleteMany({ grupo: { $in: ids }, usuario: userId });
  await Group.deleteMany({ _id: { $in: ids }, usuario: userId });
}
