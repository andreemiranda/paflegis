let _pendingOrigin = '';
let _pendingAssunto = '';

export function setContatoOrigin(origem: string, assunto = ''): void {
  _pendingOrigin = origem;
  _pendingAssunto = assunto;
}

export function consumeContatoOrigin(): { origem: string; assunto: string } {
  const result = { origem: _pendingOrigin, assunto: _pendingAssunto };
  _pendingOrigin = '';
  _pendingAssunto = '';
  return result;
}
