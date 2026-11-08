import bcrypt from 'bcryptjs';
import mongoose, { type Types } from 'mongoose';
import { connectDatabase } from './config/database.js';
import { Group } from './models/Group.js';
import { Task } from './models/Task.js';
import { User } from './models/User.js';
import {
  arvore,
  gerarHistorico,
  tarefasSoltas,
  type GrupoSeed,
  type TarefaSeed,
} from './seed-dados.js';

// Popula o banco de desenvolvimento com um usuário de demonstração e dados variados.
// Só mexe no usuário `demo`: apaga e recria os dados dele, sem tocar nos de outros usuários.
const DEMO = { nome: 'Usuário Demo', email: 'demo@email.com', senha: 'demo123' };

const prazoEm = (dias?: number) =>
  dias === undefined ? undefined : new Date(Date.now() + dias * 86_400_000);

await connectDatabase();

// Remove só os dados do usuário demo (se existir) para o script poder rodar várias vezes.
const antigo = await User.findOne({ email: DEMO.email });
if (antigo) {
  await Task.deleteMany({ usuario: antigo._id });
  await Group.deleteMany({ usuario: antigo._id });
  await antigo.deleteOne();
}

const usuario = await User.create({ ...DEMO, senha: await bcrypt.hash(DEMO.senha, 10) });
let grupos = 0;
let tarefas = 0;

async function criarTarefas(lista: TarefaSeed[] = [], grupo: Types.ObjectId | null = null) {
  for (const [titulo, status, prioridade, dias] of lista) {
    await Task.create({
      titulo,
      status,
      prioridade,
      prazo: prazoEm(dias),
      grupo,
      usuario: usuario._id,
    });
    tarefas++;
  }
}

/** Id de cada grupo pelo caminho ("Faculdade/Programação Web"), para ligar o histórico ao grupo certo. */
const idsDosGrupos = new Map<string, Types.ObjectId>();

async function criarGrupo(
  { nome, tarefas: ts, subgrupos }: GrupoSeed,
  pai: Types.ObjectId | null = null,
  prefixo = '',
) {
  const grupo = await Group.create({ nome, pai, usuario: usuario._id });
  grupos++;
  idsDosGrupos.set(prefixo + nome, grupo._id);
  await criarTarefas(ts, grupo._id);
  for (const sub of subgrupos ?? []) await criarGrupo(sub, grupo._id, `${prefixo}${nome}/`);
}

for (const raiz of arvore) await criarGrupo(raiz);
await criarTarefas(tarefasSoltas);

// Meses anteriores e o seguinte: é isso que enche o gráfico do resumo mensal.
const historico = gerarHistorico();
for (const { grupo, ...tarefa } of historico) {
  await Task.create({ ...tarefa, grupo: idsDosGrupos.get(grupo), usuario: usuario._id });
  tarefas++;
}

console.log(`Seed concluído: ${grupos} grupos e ${tarefas} tarefas para ${DEMO.email}.`);
console.log(
  `Inclui ${historico.length} tarefas distribuídas em ${new Set(historico.map((t) => t.prazo.toISOString().slice(0, 7))).size} meses para o resumo mensal.`,
);
console.log(`Login: ${DEMO.email} / ${DEMO.senha}`);
await mongoose.disconnect();
