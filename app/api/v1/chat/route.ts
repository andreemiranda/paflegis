import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, getGeminiApiKey } from '@/lib/gemini/client';
import { stripMarkdown } from '@/lib/stripMarkdown';
import { slog } from '@/lib/sapl/backend';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, 20, 60 * 1000); // 20 mensagens por minuto
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Limite de mensagens por minuto excedido. Aguarde alguns instantes.' },
      { status: 429 }
    );
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Serviço de IA indisponível: a chave GEMINI_API_KEY não está configurada no servidor.' },
      { status: 503 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const history = Array.isArray(body?.history) ? body.history : [];

  if (!message) {
    return NextResponse.json({ error: 'Mensagem vazia ou inválida.' }, { status: 400 });
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Não foi possível inicializar o cliente Gemini.' }, { status: 500 });
    }

    const systemInstruction = `Você é o assistente virtual do Paflegis, um aplicativo cívico e independente. Você é focado em ajudar o cidadão com dúvidas sobre matérias legislativas, normas jurídicas e sessões plenárias do Legislativo de Pedro Afonso - TO. Se o usuário perguntar quem você é ou se você é da câmara, deixe claro que você é o assistente do aplicativo independente Paflegis, e não um representante oficial do órgão público.

DIRETRIZES DE CONVERSA:
1. Responda em português do Brasil, de forma clara, direta, cordial e objetiva.
2. Analise todo o histórico de mensagens enviado a cada turno para manter contexto e evitar repetições.
3. Se não entender a pergunta, peça para o usuário reformular, mantendo tom profissional.
4. Se a pergunta estiver fora do escopo do Paflegis (não relacionada a matérias legislativas, normas, sessões ou ao processo legislativo de Pedro Afonso), comece sua resposta com a tag exata [FORA_DO_ESCOPO] (sem espaço antes) e explique brevemente o que você pode ajudar.
5. FORMATO DE TEXTO: Responda ESTRITAMENTE em TEXTO PLANO PURO. NUNCA use formatação markdown: NÃO use asteriscos (* ou **), NÃO use hashtags (#), NÃO use divisórias e NÃO use marcadores de lista com asterisco.
6. Mantenha a resposta completa e conclusiva.`;

    const contents = [
      ...history
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content) }],
        })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let rawReply = '';
    let isOutOfScope = false;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction, maxOutputTokens: 2048, temperature: 0.5 },
        });

        const text = response.text?.trim() || response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (text) {
          rawReply = text;
          break;
        }
      } catch (err) {
        slog('WARN', 'handleChat', `Tentativa com modelo ${modelName} falhou`, err);
      }
    }

    if (!rawReply) {
      return NextResponse.json(
        { error: 'Não foi possível gerar uma resposta no momento. Tente novamente em instantes.' },
        { status: 502 }
      );
    }

    let cleanReply = rawReply;
    if (cleanReply.startsWith('[FORA_DO_ESCOPO]')) {
      isOutOfScope = true;
      cleanReply = cleanReply.replace('[FORA_DO_ESCOPO]', '').trim();
    }

    cleanReply = stripMarkdown(cleanReply);

    return NextResponse.json({
      reply: cleanReply,
      isOutOfScope,
    });
  } catch (e: any) {
    slog('ERROR', 'handleChat', 'Erro geral ao processar chat', e);
    return NextResponse.json(
      { error: 'Erro interno ao consultar o assistente de IA.' },
      { status: 500 }
    );
  }
}
