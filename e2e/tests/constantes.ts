// Portas diferentes das de desenvolvimento (3000 e 5173): dá para rodar os testes com o app aberto.
// Os dois endereços usam `localhost` de propósito: com o mesmo "site", o cookie SameSite=Lax vai junto nas chamadas.
export const URL_API = 'http://localhost:3100';
export const URL_WEB = 'http://localhost:5174';

/** Nome do cookie de sessão que a API grava no login. */
export const COOKIE_SESSAO = 'token';

/** Fuso e idioma do navegador dos testes: datas e números aparecem iguais em qualquer máquina. */
export const FUSO = 'America/Sao_Paulo';
export const IDIOMA = 'pt-BR';
