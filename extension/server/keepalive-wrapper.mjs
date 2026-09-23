// Some nested-spawn contexts (specifically: this process launched as a child
// of watchlist-gate.js, which is itself running inside Claude Desktop's
// Electron UtilityProcess) don't reliably keep Node's event loop alive on
// the MCP SDK's stdio transport alone — the process has been observed to
// exit cleanly (code 0) a few seconds after "running on stdio" is logged,
// with no error, simply because Node decided there was no more pending work.
//
// Brute-force fix: hold an interval reference for the life of the process.
// This costs nothing at runtime and makes the exit-timing bug impossible
// regardless of whatever subtlety is happening in the transport/stdin layer.
setInterval(() => {}, 0x7fffffff);

await import("./build/plex-mcp-server.js");
