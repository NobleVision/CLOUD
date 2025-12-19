/**
 * Vercel Serverless Function for tRPC API
 * 
 * This handler processes all tRPC requests at /api/trpc/*
 * Compatible with Vercel's serverless function architecture
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { appRouter } from '../../server/routers';
import type { TrpcContext } from '../../server/_core/context';
import { createServerlessContext } from '../_lib/serverlessContext';

// Configure for serverless environment
export const config = {
  runtime: 'nodejs20.x',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to Web Request for tRPC fetch adapter
  const url = new URL(req.url || '', `https://${req.headers.host}`);
  
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  });

  // Read body for non-GET requests
  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  const webRequest = new Request(url.toString(), {
    method: req.method,
    headers,
    body: body,
  });

  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: webRequest,
      router: appRouter,
      createContext: async ({ req: fetchReq }): Promise<TrpcContext> => {
        return createServerlessContext(req, res);
      },
      onError: ({ error, path }) => {
        console.error(`[tRPC] Error in ${path}:`, error.message);
      },
    });

    // Convert Web Response to Vercel Response
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Set response headers
    Object.entries(responseHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Set status and send body
    const responseBody = await response.text();
    res.status(response.status).send(responseBody);
  } catch (error) {
    console.error('[tRPC] Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
