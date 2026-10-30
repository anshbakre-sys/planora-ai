import { NextRequest, NextResponse } from 'next/server';

const TRUSTED_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000';

/** Validate Origin header for mutation requests */
export const checkOrigin = (req: NextRequest): boolean => {
  const origin = req.headers.get('origin');
  // GET/HEAD don't need origin check
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  // Missing Origin: reject browser mutations (deliberate policy)
  if (!origin) return false;
  return origin === TRUSTED_ORIGIN;
};

export const originError = () =>
  NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid request origin' } }, { status: 403 });

export const jsonError = (code: string, message: string, status: number) =>
  NextResponse.json({ error: { code, message } }, { status });

export const jsonData = <T>(data: T, status = 200) =>
  NextResponse.json({ data }, { status });

/** Simple server-side rate limiter — ~10 AI requests per minute */
const aiRequests: number[] = [];
export const checkAiRateLimit = (): boolean => {
  const now = Date.now();
  // Remove entries older than 60s
  while (aiRequests.length > 0 && aiRequests[0] < now - 60_000) aiRequests.shift();
  if (aiRequests.length >= 10) return false;
  aiRequests.push(now);
  return true;
};

