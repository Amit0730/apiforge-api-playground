# APIForge — API Testing Playground

A lightweight, premium browser-based API testing and request debugging playground for developers. Think of it as a sleek, fast, web-only alternative to Postman or Insomnia.

## Features

- **Dynamic Request Builder:** Configure HTTP methods, URLs, headers, and query parameters dynamically.
- **Syntax-Highlighted JSON Editor:** Built with Monaco Editor for formatting, validation, and advanced code editing.
- **Detailed Response Viewer:** View status codes, response times, response sizes, headers, and format JSON beautifully.
- **Request History:** Automatically saves your recent requests in localStorage for quick access.
- **Saved Requests:** Bookmark your most used API calls.
- **CORS Proxy:** Bypasses browser CORS restrictions using a Next.js serverless function.
- **Responsive & Resizable Panels:** A true developer-tool layout with dragging panels, adaptable to mobile.

## Screenshots

*(Add screenshots of your deployed app here)*

## Architecture & CORS Limitations

APIForge operates primarily in the browser. However, browser security policies (CORS) normally prevent cross-origin HTTP requests to external APIs that don't explicitly allow them. 

To solve this, APIForge uses a **Server-Side Proxy** (`/api/proxy`). When you send a request, the browser sends it to the Next.js backend, which performs the actual fetch and returns the response. This bypasses CORS and allows testing of any public API.

## Security Considerations

- **Client-Side Storage:** History and saved requests are stored locally in your browser (`localStorage`).
- **No Secrets Stored:** The server proxy does not store or log any request data, headers, or body payloads.
- **Warning:** Do not paste highly sensitive production credentials or API keys into public web tools. Only use test credentials or local development tokens when possible.

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/apiforge-api-playground.git
   cd apiforge-api-playground
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

## Deployment

The easiest way to deploy this application is using [Vercel](https://vercel.com/):

```bash
npm i -g vercel
vercel
```

## Future Improvements

- Environments and variables mapping
- Authentication helpers (OAuth2, Bearer tokens preset)
- GraphQL support
- Code snippet generation (cURL, fetch, Python, etc.)
- Export/Import workspaces

## License

MIT License
