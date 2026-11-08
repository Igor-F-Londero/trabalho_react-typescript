import { z } from 'zod';

export const registerSchema = z.object({
  nome: z.string().trim().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
