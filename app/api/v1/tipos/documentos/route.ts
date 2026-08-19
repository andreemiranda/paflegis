import { NextRequest, NextResponse } from 'next/server';
import { ALL_38_DOCUMENT_TYPES, getDocumentTypesByCategory } from '@/lib/sapl/documentTypes';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria');

  if (categoria) {
    const filtered = ALL_38_DOCUMENT_TYPES.filter(
      (t) => t.categoria.toLowerCase() === categoria.toLowerCase()
    );
    return NextResponse.json({
      total: filtered.length,
      categoria,
      tipos: filtered,
    });
  }

  const grouped = getDocumentTypesByCategory();

  return NextResponse.json({
    total: ALL_38_DOCUMENT_TYPES.length,
    tipos: ALL_38_DOCUMENT_TYPES,
    categorias: grouped,
    atualizado_em: new Date().toISOString(),
  });
}
