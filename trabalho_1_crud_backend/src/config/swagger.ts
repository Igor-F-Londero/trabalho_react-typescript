const erro = (descricao: string) => ({
  description: descricao,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
});

const paginacaoParams = [
  { name: 'pagina', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  {
    name: 'limite',
    in: 'query',
    description: 'Itens por página (máximo 100)',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
];

const paginacaoHeaders = {
  'X-Total-Count': {
    description: 'Total de itens que atendem ao filtro (todas as páginas)',
    schema: { type: 'integer' },
  },
  'X-Page': { description: 'Página retornada', schema: { type: 'integer' } },
  'X-Limit': { description: 'Itens por página', schema: { type: 'integer' } },
};

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', example: '665f1c2e9b1e8a0012345678' },
};

const jsonBody = (ref: string) => ({
  required: true,
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } },
});

const taskResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Tarefa' } } },
});

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API de Tarefas',
    version: '1.0.0',
    description:
      'CRUD de tarefas com autenticação JWT. O login grava o token em um cookie HttpOnly (usado pelo frontend); aqui no Swagger, copie o token da resposta e clique em "Authorize".',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Sistema' }, { name: 'Auth' }, { name: 'Grupos' }, { name: 'Tarefas' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Erro: {
        type: 'object',
        properties: {
          erro: { type: 'string', example: 'Dados inválidos' },
          detalhes: { type: 'array', items: { type: 'object' } },
        },
      },
      Registro: {
        type: 'object',
        required: ['nome', 'email', 'senha'],
        properties: {
          nome: { type: 'string', example: 'Maria Silva' },
          email: { type: 'string', example: 'maria@email.com' },
          senha: { type: 'string', minLength: 6, example: '123456' },
        },
      },
      Login: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', example: 'maria@email.com' },
          senha: { type: 'string', example: '123456' },
        },
      },
      TarefaEntrada: {
        type: 'object',
        required: ['titulo'],
        properties: {
          titulo: { type: 'string', minLength: 3, maxLength: 120, example: 'Estudar Express' },
          descricao: { type: 'string', example: 'Ler a documentação' },
          status: { type: 'string', enum: ['pendente', 'em_andamento', 'concluida'] },
          prioridade: { type: 'string', enum: ['baixa', 'media', 'alta'] },
          prazo: { type: 'string', format: 'date-time' },
          grupo: { type: 'string', nullable: true, description: 'ID do grupo (null = sem grupo)' },
        },
      },
      TarefaAtualizacao: {
        type: 'object',
        description: 'Todos os campos são opcionais, mas ao menos um deve ser enviado.',
        properties: {
          titulo: { type: 'string', minLength: 3, maxLength: 120 },
          descricao: { type: 'string' },
          status: { type: 'string', enum: ['pendente', 'em_andamento', 'concluida'] },
          prioridade: { type: 'string', enum: ['baixa', 'media', 'alta'] },
          prazo: { type: 'string', format: 'date-time' },
          grupo: { type: 'string', nullable: true, description: 'ID do grupo (null = sem grupo)' },
        },
      },
      GrupoEntrada: {
        type: 'object',
        required: ['nome'],
        properties: {
          nome: { type: 'string', minLength: 2, maxLength: 80, example: 'Faculdade' },
          pai: { type: 'string', nullable: true, description: 'ID do grupo pai (null = raiz)' },
        },
      },
      GrupoAtualizacao: {
        type: 'object',
        description: 'Campos opcionais, ao menos um. Enviar "pai" move o grupo na árvore.',
        properties: {
          nome: { type: 'string', minLength: 2, maxLength: 80 },
          pai: { type: 'string', nullable: true },
        },
      },
      Grupo: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          nome: { type: 'string' },
          pai: { type: 'string', nullable: true },
          usuario: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      GrupoNo: {
        type: 'object',
        description: 'Grupo com subgrupos (recursivo) e tarefas',
        properties: {
          _id: { type: 'string' },
          nome: { type: 'string' },
          pai: { type: 'string', nullable: true },
          subgrupos: { type: 'array', items: { $ref: '#/components/schemas/GrupoNo' } },
          tarefas: { type: 'array', items: { $ref: '#/components/schemas/Tarefa' } },
        },
      },
      Tarefa: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          titulo: { type: 'string' },
          descricao: { type: 'string' },
          status: { type: 'string', enum: ['pendente', 'em_andamento', 'concluida'] },
          prioridade: { type: 'string', enum: ['baixa', 'media', 'alta'] },
          prazo: { type: 'string', format: 'date-time' },
          grupo: { type: 'string', nullable: true },
          usuario: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Verifica se a API e o banco estão disponíveis',
        responses: {
          200: { description: 'API e MongoDB conectados' },
          503: { description: 'MongoDB indisponível' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Cadastra um usuário',
        requestBody: jsonBody('Registro'),
        responses: {
          201: { description: 'Usuário criado' },
          400: erro('Dados inválidos'),
          409: erro('E-mail já cadastrado'),
          429: erro('Muitas tentativas (20 por 15 minutos por IP, divididas com o login)'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autentica, grava o JWT em cookie HttpOnly e o retorna no corpo',
        requestBody: jsonBody('Login'),
        responses: {
          200: {
            description: 'Token gerado',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { token: { type: 'string' } } },
              },
            },
          },
          400: erro('Dados inválidos'),
          401: erro('Credenciais inválidas'),
          429: erro('Muitas tentativas (20 por 15 minutos por IP, divididas com o cadastro)'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Dados do usuário logado (cookie ou Bearer)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Usuário logado' },
          401: erro('Não autenticado'),
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Encerra a sessão apagando o cookie',
        responses: { 204: { description: 'Cookie removido' } },
      },
    },
    '/grupos': {
      post: {
        tags: ['Grupos'],
        summary: 'Cria um grupo (raiz, ou subgrupo se "pai" for informado)',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody('GrupoEntrada'),
        responses: {
          201: {
            description: 'Grupo criado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Grupo' } } },
          },
          400: erro('Dados inválidos ou profundidade máxima (10 níveis) excedida'),
          401: erro('Não autenticado'),
          404: erro('Grupo pai não encontrado'),
          409: erro('Conflito com outra alteração simultânea na hierarquia'),
        },
      },
      get: {
        tags: ['Grupos'],
        summary: 'Lista grupos do usuário (plano)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'pai',
            in: 'query',
            description: 'ID do pai para listar seus filhos diretos, ou "raiz" para grupos de topo',
            schema: { type: 'string' },
          },
          ...paginacaoParams,
        ],
        responses: {
          200: {
            description: 'Lista de grupos (uma página)',
            headers: paginacaoHeaders,
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Grupo' } },
              },
            },
          },
          400: erro('Filtro ou paginação inválidos (?pai, ?pagina, ?limite)'),
          401: erro('Não autenticado'),
        },
      },
    },
    '/grupos/arvore': {
      get: {
        tags: ['Grupos'],
        summary: 'Árvore completa de grupos, subgrupos e tarefas',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Árvore',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    grupos: { type: 'array', items: { $ref: '#/components/schemas/GrupoNo' } },
                    tarefasSemGrupo: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Tarefa' },
                    },
                  },
                },
              },
            },
          },
          401: erro('Não autenticado'),
        },
      },
    },
    '/grupos/{id}': {
      get: {
        tags: ['Grupos'],
        summary: 'Consulta um grupo com seus filhos diretos e tarefas',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        responses: {
          200: {
            description: 'Grupo encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/GrupoNo' } } },
          },
          400: erro('ID inválido'),
          401: erro('Não autenticado'),
          404: erro('Grupo não encontrado'),
        },
      },
      put: {
        tags: ['Grupos'],
        summary: 'Renomeia ou move um grupo',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        requestBody: jsonBody('GrupoAtualizacao'),
        responses: {
          200: {
            description: 'Grupo atualizado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Grupo' } } },
          },
          400: erro(
            'Dados inválidos, movimento que criaria ciclo ou profundidade máxima (10 níveis) excedida',
          ),
          401: erro('Não autenticado'),
          404: erro('Grupo ou novo pai não encontrado'),
          409: erro('Conflito com outra alteração simultânea na hierarquia'),
        },
      },
      delete: {
        tags: ['Grupos'],
        summary: 'Exclui um grupo',
        description:
          'Se o grupo tiver subgrupos ou tarefas, retorna 409, a menos que cascata=true (exclui tudo dentro dele).',
        security: [{ bearerAuth: [] }],
        parameters: [
          idParam,
          { name: 'cascata', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        responses: {
          204: { description: 'Grupo excluído' },
          400: erro('ID ou parâmetro inválido'),
          401: erro('Não autenticado'),
          404: erro('Grupo não encontrado'),
          409: erro('Grupo não está vazio'),
        },
      },
    },
    '/tarefas/resumo-mensal': {
      get: {
        tags: ['Tarefas'],
        summary: 'Resumo mensal de conclusão, com média ponderada pela prioridade',
        description:
          'Agrupa as tarefas pelo mês do prazo. `taxa` é concluídas/total; `taxaPonderada` conta cada tarefa com o peso da prioridade (alta 3, média 2, baixa 1). Tarefas sem prazo ficam fora e são contadas em `geral.semPrazo`.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'ano',
            in: 'query',
            description: 'Limita o resumo a um ano (2000 a 2100); sem ele considera todos',
            schema: { type: 'integer', example: 2026 },
          },
        ],
        responses: {
          200: { description: 'Resumo por mês (ordem cronológica) e totais gerais' },
          400: erro('Ano inválido'),
          401: erro('Não autenticado'),
        },
      },
    },
    '/tarefas': {
      post: {
        tags: ['Tarefas'],
        summary: 'Cria uma tarefa',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody('TarefaEntrada'),
        responses: {
          201: taskResponse('Tarefa criada'),
          400: erro('Dados inválidos'),
          401: erro('Não autenticado'),
        },
      },
      get: {
        tags: ['Tarefas'],
        summary: 'Lista as tarefas do usuário',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['pendente', 'em_andamento', 'concluida'] },
          },
          {
            name: 'grupo',
            in: 'query',
            description: 'ID do grupo, ou "nenhum" para tarefas sem grupo',
            schema: { type: 'string' },
          },
          {
            name: 'prioridade',
            in: 'query',
            schema: { type: 'string', enum: ['baixa', 'media', 'alta'] },
          },
          ...paginacaoParams,
        ],
        responses: {
          200: {
            description: 'Lista de tarefas (uma página)',
            headers: paginacaoHeaders,
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Tarefa' } },
              },
            },
          },
          400: erro(
            'Filtro ou paginação inválidos (?status, ?prioridade, ?grupo, ?pagina, ?limite)',
          ),
          401: erro('Não autenticado'),
        },
      },
    },
    '/tarefas/{id}': {
      get: {
        tags: ['Tarefas'],
        summary: 'Consulta uma tarefa pelo ID',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        responses: {
          200: taskResponse('Tarefa encontrada'),
          400: erro('ID inválido'),
          401: erro('Não autenticado'),
          404: erro('Tarefa não encontrada'),
        },
      },
      put: {
        tags: ['Tarefas'],
        summary: 'Atualiza uma tarefa',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        requestBody: jsonBody('TarefaAtualizacao'),
        responses: {
          200: taskResponse('Tarefa atualizada'),
          400: erro('Dados ou ID inválidos'),
          401: erro('Não autenticado'),
          404: erro('Tarefa não encontrada'),
        },
      },
      delete: {
        tags: ['Tarefas'],
        summary: 'Exclui uma tarefa',
        security: [{ bearerAuth: [] }],
        parameters: [idParam],
        responses: {
          204: { description: 'Tarefa excluída' },
          400: erro('ID inválido'),
          401: erro('Não autenticado'),
          404: erro('Tarefa não encontrada'),
        },
      },
    },
  },
};
