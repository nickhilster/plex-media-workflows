#!/usr/bin/env python3
"""Launch the local stdio gate using a token from Linux Secret Service."""
import os
from pathlib import Path
import shutil
import subprocess
import sys


def main():
    if len(sys.argv) != 1:
        raise SystemExit('This launcher accepts no arguments.')
    node = os.environ.get('PLEX_MCP_NODE') or shutil.which('node')
    if not node or not Path(node).is_file():
        raise SystemExit('Set PLEX_MCP_NODE to a Node.js 20+ executable.')
    try:
        result = subprocess.run(
            ['/usr/bin/secret-tool', 'lookup', 'service', 'codex-plex-readonly',
             'account', 'nikhil'],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=30,
            check=True,
        )
    except (OSError, subprocess.SubprocessError):
        raise SystemExit('Plex keyring lookup failed; unlock your desktop keyring.') from None
    token = result.stdout.decode().strip()
    if not token:
        raise SystemExit('No Plex token found in the desktop keyring.')
    env = {k: v for k, v in os.environ.items()
           if k not in ('NODE_OPTIONS', 'NODE_PATH')}
    env['PLEX_TOKEN'] = token
    env['PLEX_URL'] = 'http://127.0.0.1:32400'
    gate = Path(__file__).resolve().with_name('read-only-mcp.mjs')
    os.execve(node, [node, str(gate)], env)


if __name__ == '__main__':
    main()
