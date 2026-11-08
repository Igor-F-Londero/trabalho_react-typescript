/** Erro de negócio com status HTTP; o `errorHandler` o converte em resposta JSON. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
