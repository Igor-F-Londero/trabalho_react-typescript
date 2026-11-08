import type { PRIORIDADES, STATUS } from './models/Task.js';

// Dados de demonstração do `npm run seed`. Ficam separados do script para poderem ser testados
// sem conectar ao banco.

type Status = (typeof STATUS)[number];
type Prioridade = (typeof PRIORIDADES)[number];

export type TarefaSeed = [
  titulo: string,
  status: Status,
  prioridade: Prioridade,
  diasDoPrazo?: number,
];
export interface GrupoSeed {
  nome: string;
  tarefas?: TarefaSeed[];
  subgrupos?: GrupoSeed[];
}

// `diasDoPrazo` é relativo a hoje: negativo = atrasada.
export const arvore: GrupoSeed[] = [
  {
    nome: 'Faculdade',
    tarefas: [['Renovar matrícula', 'concluida', 'alta', -20]],
    subgrupos: [
      {
        nome: 'Programação Web',
        tarefas: [
          ['Entregar trabalho final de React', 'em_andamento', 'alta', 5],
          ['Estudar hooks do React', 'concluida', 'media', -3],
          ['Preparar apresentação do backend', 'pendente', 'alta', 3],
        ],
        subgrupos: [
          {
            nome: 'Projeto final',
            tarefas: [
              ['Escrever testes da autenticação', 'concluida', 'alta', -2],
              ['Atualizar a documentação', 'em_andamento', 'media', 2],
              ['Gravar vídeo de demonstração', 'pendente', 'baixa', 7],
            ],
          },
        ],
      },
      {
        nome: 'Banco de Dados',
        tarefas: [
          ['Lista de exercícios de SQL', 'pendente', 'media', -1],
          ['Ler capítulo sobre normalização', 'em_andamento', 'baixa', 10],
          ['Comparar MongoDB e PostgreSQL', 'pendente', 'media', 12],
        ],
      },
      {
        nome: 'Cálculo II',
        tarefas: [
          ['Prova de integrais', 'pendente', 'alta', 6],
          ['Resolver lista 3', 'concluida', 'media', -8],
        ],
      },
    ],
  },
  {
    nome: 'Casa',
    tarefas: [
      ['Pagar conta de luz', 'pendente', 'alta', 1],
      ['Trocar lâmpada da sala', 'concluida', 'baixa', -6],
    ],
    subgrupos: [
      {
        nome: 'Compras',
        tarefas: [
          ['Comprar café e leite', 'pendente', 'media', 0],
          ['Repor material de limpeza', 'pendente', 'baixa', 4],
        ],
      },
      {
        nome: 'Manutenção',
        tarefas: [['Chamar encanador', 'em_andamento', 'alta', -2]],
      },
    ],
  },
  {
    nome: 'Saúde',
    tarefas: [
      ['Marcar consulta de rotina', 'pendente', 'media', 14],
      ['Treinar 3x na semana', 'em_andamento', 'media'],
      ['Beber 2 litros de água por dia', 'em_andamento', 'baixa'],
    ],
  },
  {
    nome: 'Estudos pessoais',
    subgrupos: [
      {
        nome: 'Inglês',
        tarefas: [
          ['Fazer 15 min de Duolingo', 'em_andamento', 'baixa'],
          ['Assistir uma série sem legenda', 'pendente', 'baixa', 9],
        ],
      },
    ],
  },
];

export const tarefasSoltas: TarefaSeed[] = [
  ['Ligar para a vovó', 'pendente', 'media', 2],
  ['Organizar a mesa de trabalho', 'pendente', 'baixa'],
  ['Renovar assinatura do antivírus', 'pendente', 'alta', -4],
];

/** Todos os grupos e subgrupos como caminhos "Pai/Filho" (ex.: "Faculdade/Programação Web"). */
export function caminhosDosGrupos(grupos: GrupoSeed[], prefixo = ''): Set<string> {
  const caminhos = new Set<string>();
  for (const { nome, subgrupos } of grupos) {
    const caminho = prefixo + nome;
    caminhos.add(caminho);
    for (const filho of caminhosDosGrupos(subgrupos ?? [], `${caminho}/`)) caminhos.add(filho);
  }
  return caminhos;
}

export interface TarefaHistorica {
  titulo: string;
  status: Status;
  prioridade: Prioridade;
  prazo: Date;
  /** Caminho do grupo (ver `caminhosDosGrupos`). */
  grupo: string;
}

type Linha = [grupo: string, titulo: string, status: Status, prioridade: Prioridade, dia: number];

/**
 * Tarefas de meses anteriores e do seguinte, para o gráfico do resumo mensal ter o que mostrar.
 * Cada item é [meses de diferença em relação ao mês de hoje, tarefas]. O mês atual fica de fora porque
 * já recebe as tarefas da `arvore`. A taxa de conclusão sobe e desce de propósito, e o mês que vem
 * ainda não tem nada concluído. Dias até 28 para valerem em qualquer mês.
 */
const HISTORICO: [mesesDeDiferenca: number, tarefas: Linha[]][] = [
  [
    -7,
    [
      ['Faculdade', 'Matrícula nas disciplinas do semestre', 'concluida', 'alta', 5],
      ['Faculdade', 'Montar o cronograma de estudos', 'concluida', 'media', 9],
      [
        'Faculdade/Programação Web',
        'Instalar o ambiente de desenvolvimento',
        'concluida',
        'baixa',
        12,
      ],
      ['Faculdade/Cálculo II', 'Primeira lista de limites', 'pendente', 'alta', 20],
      ['Casa', 'Organizar o guarda-roupa', 'pendente', 'baixa', 25],
    ],
  ],
  [
    -6,
    [
      ['Faculdade/Banco de Dados', 'Primeira prova de Banco de Dados', 'concluida', 'alta', 6],
      [
        'Faculdade/Programação Web',
        'Exercícios de lógica de programação',
        'concluida',
        'media',
        10,
      ],
      ['Saúde', 'Fazer exame médico anual', 'concluida', 'media', 14],
      ['Casa/Manutenção', 'Trocar o chuveiro', 'pendente', 'media', 18],
      ['Estudos pessoais/Inglês', 'Estudar vocabulário de viagem', 'pendente', 'baixa', 22],
      ['Faculdade/Banco de Dados', 'Ler artigo sobre índices', 'em_andamento', 'baixa', 27],
    ],
  ],
  [
    -5,
    [
      ['Faculdade/Cálculo II', 'Prova de derivadas', 'concluida', 'alta', 4],
      ['Faculdade/Cálculo II', 'Lista de exercícios de derivadas', 'concluida', 'media', 8],
      ['Faculdade/Programação Web', 'Trabalho de HTML e CSS', 'concluida', 'alta', 11],
      ['Faculdade/Banco de Dados', 'Seminário de modelagem', 'pendente', 'alta', 16],
      ['Faculdade', 'Revisar a matéria da recuperação', 'pendente', 'media', 19],
      ['Casa', 'Pagar o IPTU', 'pendente', 'media', 23],
      ['Saúde', 'Comprar tênis de corrida', 'pendente', 'baixa', 26],
    ],
  ],
  [
    -4,
    [
      ['Casa/Compras', 'Reservar o hotel da viagem', 'concluida', 'media', 3],
      ['Casa', 'Renovar a CNH', 'concluida', 'alta', 10],
      ['Estudos pessoais', 'Ler um livro por semana', 'concluida', 'baixa', 17],
      ['Estudos pessoais/Inglês', 'Curso de inglês: módulo 1', 'pendente', 'alta', 24],
    ],
  ],
  [
    -3,
    [
      ['Faculdade', 'Matrícula do novo semestre', 'concluida', 'alta', 3],
      ['Faculdade', 'Comprar material novo', 'concluida', 'baixa', 6],
      [
        'Faculdade/Programação Web/Projeto final',
        'Definir o tema do projeto final',
        'concluida',
        'alta',
        14,
      ],
      ['Faculdade/Banco de Dados', 'Esboço do banco de dados', 'concluida', 'media', 20],
      ['Saúde', 'Marcar consulta no dentista', 'pendente', 'media', 22],
      ['Casa', 'Pintar a parede da sala', 'pendente', 'baixa', 27],
    ],
  ],
  [
    -2,
    [
      ['Faculdade/Programação Web/Projeto final', 'Protótipo da interface', 'concluida', 'alta', 5],
      [
        'Faculdade/Programação Web/Projeto final',
        'Modelagem do banco do projeto',
        'concluida',
        'alta',
        9,
      ],
      ['Faculdade/Cálculo II', 'Prova de séries', 'concluida', 'alta', 12],
      ['Faculdade/Programação Web', 'Estudar TypeScript', 'concluida', 'media', 15],
      ['Saúde', 'Corrida de 5 km', 'concluida', 'baixa', 21],
      ['Faculdade/Banco de Dados', 'Lista de SQL avançado', 'pendente', 'media', 24],
      ['Casa', 'Revisar o orçamento do mês', 'pendente', 'baixa', 27],
    ],
  ],
  [
    -1,
    [
      [
        'Faculdade/Programação Web/Projeto final',
        'Implementar o backend do projeto',
        'concluida',
        'alta',
        7,
      ],
      [
        'Faculdade/Programação Web/Projeto final',
        'Escrever os testes da API',
        'concluida',
        'alta',
        11,
      ],
      ['Faculdade/Banco de Dados', 'Apresentar o seminário de índices', 'concluida', 'alta', 15],
      ['Casa/Manutenção', 'Fazer a revisão do carro', 'concluida', 'media', 18],
      ['Estudos pessoais/Inglês', 'Terminar o curso de inglês', 'concluida', 'baixa', 23],
      ['Casa', 'Doar roupas antigas', 'pendente', 'baixa', 28],
    ],
  ],
  [
    1,
    [
      [
        'Faculdade/Programação Web/Projeto final',
        'Entrega final do projeto',
        'em_andamento',
        'alta',
        6,
      ],
      ['Faculdade/Cálculo II', 'Prova final de Cálculo II', 'pendente', 'alta', 10],
      [
        'Faculdade/Banco de Dados',
        'Estudar para o exame de Banco de Dados',
        'pendente',
        'media',
        14,
      ],
      ['Casa/Compras', 'Comprar presentes', 'pendente', 'media', 20],
      ['Saúde', 'Renovar o plano de saúde', 'pendente', 'baixa', 27],
    ],
  ],
];

/** Tarefas dos meses ao redor de `hoje` (UTC, como o resumo mensal agrupa). Sem sorteios: a mesma data dá os mesmos dados. */
export function gerarHistorico(hoje = new Date()): TarefaHistorica[] {
  const ano = hoje.getUTCFullYear();
  const mes = hoje.getUTCMonth();
  return HISTORICO.flatMap(([diferenca, linhas]) =>
    linhas.map(([grupo, titulo, status, prioridade, dia]) => ({
      titulo,
      status,
      prioridade,
      grupo,
      prazo: new Date(Date.UTC(ano, mes + diferenca, dia, 12)),
    })),
  );
}
