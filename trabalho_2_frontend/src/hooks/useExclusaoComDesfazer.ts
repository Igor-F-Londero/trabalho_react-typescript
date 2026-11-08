import { useQueryClient } from '@tanstack/react-query';
import { ESPERA_DESFAZER, adiarExclusao } from '../lib/exclusoes';
import { mensagemDeErro } from '../services/api';
import { invalidarTudo } from './consultas';
import { useToast } from './useToast';

/**
 * Esconde `ids` já e só executa `excluir` (a chamada à API) depois de `ESPERA_DESFAZER`,
 * oferecendo "Desfazer" no aviso. Se `excluir` falhar, avisa e o item reaparece.
 */
export function useExclusaoComDesfazer() {
  const qc = useQueryClient();
  const avisar = useToast();

  return (ids: string[], texto: string, excluir: () => Promise<unknown>) => {
    const { desfazer } = adiarExclusao(ids, async () => {
      try {
        await excluir();
      } catch (err) {
        avisar(mensagemDeErro(err));
      }
      await invalidarTudo(qc);
    });
    avisar(texto, 'ok', { duracao: ESPERA_DESFAZER, acao: { rotulo: 'Desfazer', icone: 'desfazer', aoClicar: desfazer } });
  };
}
