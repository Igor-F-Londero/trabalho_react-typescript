import mongoose from 'mongoose';
import { env } from './env.js';

/** Abre a conexão com o MongoDB. A URI é parametrizável para os testes usarem um banco em memória. */
export async function connectDatabase(uri: string = env.mongoUri) {
  await mongoose.connect(uri);
}
