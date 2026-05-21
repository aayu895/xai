import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BACKEND_API_URL = 'https://xai-backend-j704.onrender.com/api/v1';

function getBackendApiUrl() {
  return (
    process.env.BACKEND_API_URL?.trim() ||
    DEFAULT_BACKEND_API_URL
  ).replace(/\/+$/, '');
}

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const search = request.nextUrl.search || '';
  const url = `${getBackendApiUrl()}/${path}${search}`;
  const headers = new Headers();
  const authorization = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');

  if (authorization) headers.set('authorization', authorization);
  if (contentType) headers.set('content-type', contentType);
  if (accept) headers.set('accept', accept);

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  let response: Response;
  try {
    response = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail: 'Backend API is not reachable. Check BACKEND_API_URL in Vercel.',
        backendUrl: getBackendApiUrl(),
        error: error instanceof Error ? error.message : 'Unknown proxy error',
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const dynamic = 'force-dynamic';

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as OPTIONS,
};
