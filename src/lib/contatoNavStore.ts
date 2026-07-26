/**
 * Store módulo-nível para transmitir a origem de navegação
 * das páginas legais para ContatoView sem precisar de props ou contexto React.
 *
 * Uso:
 *   1. Página legal chama setContatoOrigin('Política de Privacidade') + onSelectTab('contato')
 *   2. ContatoView lê consumeContatoOrigin() no useEffect/useState inicial
 */

let _pendingOrigin = '';
let _pendingAssunto = '';

export function setContatoOrigin(origem: string, assunto = ''): void {
  _pendingOrigin  = origem;
  _pendingAssunto = assunto;
}

/** Lê e limpa os valores pendentes. Chamar uma única vez no mount do ContatoView. */
export function consumeContatoOrigin(): { origem: string; assunto: string } {
  const result = { origem: _pendingOrigin, assunto: _pendingAssunto };
  _pendingOrigin  = '';
  _pendingAssunto = '';
  return result;
}
