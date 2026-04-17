#!/usr/bin/env node
// @houtini/gemini-mcp@2.4.0 has a dual-spawn bug: dist/cli.js (the package's
// bin) imports dist/index.js, whose module-level `main().catch(...)` starts a
// server on load, and cli.js then instantiates and starts a second server.
// Both servers connect the same StdioServerTransport to process.stdin/stdout
// and respond to every request — Claude's MCP client sees duplicate response
// IDs and the transport dies.
//
// Importing dist/index.js directly as the entry point triggers only that
// module's auto-running main() — one server, one set of responses. No upstream
// patch needed; we just bypass cli.js.
// The package's `exports` map defines only `.` (→ dist/index.js). Subpath
// imports like `@houtini/gemini-mcp/dist/index.js` are blocked with
// ERR_PACKAGE_PATH_NOT_EXPORTED, so import the bare package — same target.
import '@houtini/gemini-mcp';
