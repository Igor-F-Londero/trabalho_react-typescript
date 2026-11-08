import { useTema } from '../hooks/useTema';
import BotaoIcone from './BotaoIcone';

/** Botão sol/lua que alterna entre o tema claro e o escuro. */
export default function AlternarTema() {
  const { tema, alternar } = useTema();
  const paraEscuro = tema === 'claro';

  return (
    <BotaoIcone
      icone={paraEscuro ? 'lua' : 'sol'}
      rotulo={paraEscuro ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'}
      className="link"
      onClick={alternar}
    />
  );
}
