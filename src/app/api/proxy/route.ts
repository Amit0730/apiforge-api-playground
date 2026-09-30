import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, method, headers, requestBody } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const startTime = Date.now();
    
    // Construct fetch options
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: headers || {},
    };

    if (method !== 'GET' && method !== 'HEAD' && requestBody) {
      fetchOptions.body = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
    }

    const response = await fetch(url, fetchOptions);
    const endTime = Date.now();
    const time = endTime - startTime;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const text = await response.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Keep as text if not JSON
    }

    const size = new TextEncoder().encode(text).length;

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      time,
      size,
      headers: responseHeaders,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An error occurred while proxying the request.' },
      { status: 500 }
    );
  }
}
