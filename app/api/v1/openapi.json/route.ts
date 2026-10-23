import { NextRequest, NextResponse } from 'next/server';
import { getDynamicOpenApiSpec } from '@/lib/openApiSpec';
import { resolveRequestOrigin } from '@/lib/config';

export async function GET(req: NextRequest) {
  const origin = resolveRequestOrigin(req.headers);
  const spec = getDynamicOpenApiSpec(origin);
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
