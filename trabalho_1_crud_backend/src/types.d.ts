declare global {
  namespace Express {
    interface Request {
      /** Definido por `authenticate`; só use em rotas autenticadas. */
      userId: string;
    }
  }
}

export {};
