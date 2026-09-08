import assert from "node:assert/strict";
import test from "node:test";

import {
  getBearerToken,
  getListenOptions,
  isAuthorized,
  stdioServerParameters,
} from "./remote-http-bridge.js";

test("isAuthorized only accepts an exact bearer token", () => {
  assert.equal(isAuthorized({ authorization: "Bearer secret-token" }, "secret-token"), true);
  assert.equal(isAuthorized({}, "secret-token"), false);
  assert.equal(isAuthorized({ authorization: "Bearer wrong" }, "secret-token"), false);
  assert.equal(isAuthorized({ authorization: "Basic secret-token" }, "secret-token"), false);
  assert.equal(isAuthorized({ authorization: "Bearer secret-token " }, "secret-token"), false);
});

test("getBearerToken requires a non-empty secret", () => {
  assert.equal(getBearerToken({ MCP_REMOTE_BEARER_TOKEN: " abc123 " }), "abc123");
  assert.throws(() => getBearerToken({}), /MCP_REMOTE_BEARER_TOKEN/);
  assert.throws(() => getBearerToken({ MCP_REMOTE_BEARER_TOKEN: "   " }), /MCP_REMOTE_BEARER_TOKEN/);
});

test("getListenOptions defaults to localhost and validates port", () => {
  assert.deepEqual(getListenOptions({}), { host: "127.0.0.1", port: 3333 });
  assert.deepEqual(getListenOptions({ MCP_REMOTE_HOST: "0.0.0.0", MCP_REMOTE_PORT: "4040" }), {
    host: "0.0.0.0",
    port: 4040,
  });
  assert.throws(() => getListenOptions({ MCP_REMOTE_PORT: "0" }), /Invalid MCP_REMOTE_PORT/);
  assert.throws(() => getListenOptions({ MCP_REMOTE_PORT: "nope" }), /Invalid MCP_REMOTE_PORT/);
});

test("stdioServerParameters launches the watchlist gate, not the raw server", () => {
  const params = stdioServerParameters({ PLEX_TOKEN: "local-secret" });

  assert.equal(params.command, process.execPath);
  assert.match(params.args[0], /watchlist-gate\.js$/);
  assert.equal(params.env.PLEX_TOKEN, "local-secret");
  assert.equal(params.env.PLEX_ENABLE_MUTATIVE_OPS, undefined);
});
