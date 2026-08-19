import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openApiSpec';

export async function GET() {
  return NextResponse.json(openApiSpec);
}
