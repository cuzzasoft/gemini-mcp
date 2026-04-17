# @cuzzasoft/gemini-mcp

Thin wrapper around [@houtini/gemini-mcp](https://www.npmjs.com/package/@houtini/gemini-mcp) that sidesteps a dual-spawn bug by invoking `dist/index.js` directly instead of the package's `dist/cli.js` bin.

## The bug

`@houtini/gemini-mcp@2.4.0`'s `dist/cli.js`:

```js
import { GeminiMcpServer } from './index.js';  // side-effect: index.js runs main(), starts server #1
async function cli() {
  const server = new GeminiMcpServer();         // server #2
  await server.start();
}
cli();
```

Both servers bind `StdioServerTransport` to the same `process.stdin` / `process.stdout`. A single `initialize` request produces two responses with the same id, which crashes Claude Code's MCP client.

## The fix

Don't invoke `cli.js`. Just import `dist/index.js` directly — its own `main().catch(...)` runs once and there's no second `new GeminiMcpServer()` anywhere. One server, one transport, works.

`bin.mjs` is effectively a one-liner:

```js
import '@houtini/gemini-mcp';
```

(The package's `exports` map restricts subpath imports, but `.` already resolves to `dist/index.js`.)

## Usage

In your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "gemini": {
      "command": "npx",
      "args": ["-y", "github:cuzzasoft/gemini-mcp"]
    }
  }
}
```

`GEMINI_API_KEY` must be set in the environment Claude Code runs in.

## Verifying the bug

```bash
# Two responses (broken):
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}\n' \
  | npx -y @houtini/gemini-mcp@2.4.0 2>/dev/null | grep -c '"jsonrpc"'

# One response (this wrapper):
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}\n' \
  | npx -y github:cuzzasoft/gemini-mcp 2>/dev/null | grep -c '"jsonrpc"'
```

## License

MIT. Upstream `@houtini/gemini-mcp` is Apache-2.0 — this wrapper adds no code from it, just a single `import` statement.
