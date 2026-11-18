import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import AlternarTema from '../components/AlternarTema';
import Botao from '../components/Botao';
import { CARTAO, ERRO } from '../components/estilos';
import { CHAVE_SESSAO } from '../hooks/useSessao';
import { api, mensagemDeErro } from '../services/api';

export default function LoginPage() {
  const client = useQueryClient();
  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      if (modoCadastro) await api.register(nome, email, senha);
      await api.login(email, senha);
      // O servidor gravou o cookie; buscar o usuário faz a guarda de rota liberar o dashboard.
      await client.invalidateQueries({ queryKey: CHAVE_SESSAO });
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <div className="absolute top-3 right-3">
        <AlternarTema />
      </div>
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
        <form className={`${CARTAO} flex flex-col gap-3 p-6`} onSubmit={enviar}>
          <svg viewBox="0 0 24 24" className="size-9 text-primaria" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <path d="M8 12.5l2.7 2.7L16 9.5" />
          </svg>
          <h1 className="text-2xl font-semibold">{modoCadastro ? 'Criar conta' : 'Entrar'}</h1>
          {modoCadastro && (
            <input placeholder="Nome" aria-label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          )}
          <input type="email" placeholder="E-mail" aria-label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" aria-label="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          {erro && <p className={ERRO} role="alert">{erro}</p>}
          <Botao type="submit" disabled={carregando} className="w-full">
            {carregando
              ? modoCadastro ? 'Cadastrando…' : 'Entrando…'
              : modoCadastro ? 'Cadastrar e entrar' : 'Entrar'}
          </Botao>
          <Botao variante="discreto" className="w-full" onClick={() => setModoCadastro(!modoCadastro)}>
            {modoCadastro ? 'Já tenho conta' : 'Criar uma conta'}
          </Botao>
        </form>
      </main>
    </>
  );
}
