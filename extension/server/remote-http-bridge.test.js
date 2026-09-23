import assert from "node:assert/strict";
import test from "node:test";

import {
  getBearerToken,
  getListenOptions,
  isAuthorized,
  stdioServerParameters,
  SessionStore,
} from "./remote-http-bridge.js";

function fakeEntry() {
  return {
    httpTransport: { close: async () => {} },
    stdioTransport: { close: async () => {} },
  };
}

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

test("SessionStore.tryReserve enforces maxSessions across concurrent reservations (TOCTOU fix)", () => {
  const store = new SessionStore({ maxSessions: 5, idleTimeoutMs: 300_000 });

  // Simulate 50 "concurrent" requests all racing to reserve a slot before
  // any of them has actually been added as a real session — this is exactly
  // the interleaving that let the old hasCapacity()-then-later-add() code
  // blow past maxSessions arbitrarily.
  const reserved = Array.from({ length: 50 }, () => store.tryReserve());
  const successCount = reserved.filter(Boolean).length;

  assert.equal(successCount, 5, "only maxSessions reservations should succeed");
  assert.equal(store.tryReserve(), false, "no capacity left for a 6th reservation");

  // Releasing a reservation (as happens when session creation fails) frees
  // the slot back up.
  store.releaseReservation();
  assert.equal(store.tryReserve(), true);

  store.closeAll();
});

test("SessionStore.add converts a reservation into a real session without double-counting capacity", () => {
  const store = new SessionStore({ maxSessions: 1, idleTimeoutMs: 300_000 });

  assert.equal(store.tryReserve(), true);
  assert.equal(store.tryReserve(), false, "second reservation blocked while first is pending");

  store.add("session-1", fakeEntry());
  assert.equal(store.size, 1);
  // The reservation was released by add(), and the real session now
  // occupies the only slot — still exactly at capacity, not over it.
  assert.equal(store.tryReserve(), false, "at capacity once the reservation became a real session");

  store.closeAll();
});

test("SessionStore.sweep never closes a session with an in-flight request", () => {
  // Negative idleTimeoutMs pushes the cutoff into the future relative to
  // "now", so any session not currently protected by activeRequests > 0
  // is unconditionally swept — this isolates the activeRequests guard
  // itself from real-clock timing flakiness (same-millisecond Date.now()
  // calls would otherwise make a 0ms timeout an unreliable test).
  const store = new SessionStore({ maxSessions: 5, idleTimeoutMs: -60_000 });
  store.add("busy-session", fakeEntry());

  store.beginRequest("busy-session");
  store.sweep();
  assert.equal(store.size, 1, "sweep must not close a session with an active request");

  store.endRequest("busy-session");
  store.sweep();
  assert.equal(store.size, 0, "sweep closes it once the request finishes and it goes idle");

  store.closeAll();
});
