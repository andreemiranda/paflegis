import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/lib/rateLimiter';
import { validateApiRequest } from '@/lib/auth/apiKeyAuth';

export async function POST(req: NextRequest) {
  // Valida autenticação
  const auth = validateApiRequest(req);
  if (!auth.authorized) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
  }

  // Rate limit
  const rl = checkRateLimit(req, 20, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ erro: 'Limite de requisições excedido.' }, { status: 429 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      disponivel: false,
      mensagem: 'Recurso de IA opcional. Configure GEMINI_API_KEY nas variáveis de ambiente para ativar resumos automatizados.',
    }, { status: 200 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'Dados inválidos.' }, { status: 400 });
  }

  const { ementa, tipo, numero, ano } = body;
  if (!ementa) {
    return NextResponse.json({ erro: 'Ementa é obrigatória.' }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Você é um assistente de transparência cívica legislativa municipal.
Resuma em linguagem clara, simples e direta (máximo 3 frases) o impacto prático desta matéria legislativa para o cidadão:
Documento: ${tipo || 'Matéria'} Nº ${numero || ''}/${ano || ''}
Ementa Oficial: ${ementa}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({
      disponivel: true,
      resumo: response.text,
      modelo: 'gemini-2.5-flash',
    });
  } catch (err: any) {
    return NextResponse.json({
      disponivel: false,
      erro: err.message || 'Erro ao processar resumo com IA.',
    }, { status: 500 });
  }
}
