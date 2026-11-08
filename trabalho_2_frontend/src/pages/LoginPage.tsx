import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import AlternarTema from '../components/AlternarTema';
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
      <div className="login-tema">
        <AlternarTema />
      </div>
      <form className="card login" onSubmit={enviar}>
      <h1>{modoCadastro ? 'Criar conta' : 'Entrar'}</h1>
      {modoCadastro && (
        <input placeholder="Nome" aria-label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      )}
      <input type="email" placeholder="E-mail" aria-label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Senha" aria-label="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
      {erro && <p className="erro" role="alert">{erro}</p>}
      <button disabled={carregando}>
        {carregando
          ? modoCadastro ? 'Cadastrando…' : 'Entrando…'
          : modoCadastro ? 'Cadastrar e entrar' : 'Entrar'}
      </button>
      <button type="button" className="link" onClick={() => setModoCadastro(!modoCadastro)}>
        {modoCadastro ? 'Já tenho conta' : 'Criar uma conta'}
      </button>
      </form>
    </>
  );
}
