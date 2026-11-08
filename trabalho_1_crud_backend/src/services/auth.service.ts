import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { AppError } from '../utils/AppError.js';

/** Cadastra o usuário guardando só o hash da senha; nunca devolve a senha. */
export async function register({ nome, email, senha }: RegisterInput) {
  if (await User.exists({ email: email.toLowerCase() })) {
    throw new AppError(409, 'E-mail já cadastrado');
  }
  // 1ª barreira: checagem amigável. A 2ª (abaixo) cobre cadastros simultâneos.
  let user;
  try {
    user = await User.create({ nome, email, senha: await bcrypt.hash(senha, 10) });
  } catch (err) {
    // Requisições simultâneas passam pelo exists; o índice único barra a segunda.
    if ((err as { code?: number }).code === 11000) throw new AppError(409, 'E-mail já cadastrado');
    throw err;
  }
  return { id: user.id, nome: user.nome, email: user.email };
}

/** Mensagem igual para e-mail inexistente e senha errada, para não revelar quais e-mails existem. */
export async function login({ email, senha }: LoginInput) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(senha, user.senha))) {
    throw new AppError(401, 'Credenciais inválidas');
  }
  // O id do usuário vai no `sub` do token e é lido de volta no `authenticate`.
  const token = jwt.sign({}, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
  return { token };
}

/** Dados públicos do usuário logado (nunca a senha). */
export async function getById(id: string) {
  const user = await User.findById(id);
  if (!user) throw new AppError(401, 'Usuário não encontrado');
  return { id: user.id, nome: user.nome, email: user.email };
}
