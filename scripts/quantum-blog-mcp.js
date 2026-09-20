#!/usr/bin/env node

/**
 * Quantum Qbit Blog Model Context Protocol (MCP) Server
 * Stdio JSON-RPC 2.0 implementation for Claude Desktop, Cursor, Antigravity, and Windsurf.
 * 
 * Usage:
 *   node scripts/quantum-blog-mcp.js
 * 
 * Environment variables:
 *   QUANTUM_API_KEY: Your Quantum Qbit secret API key (obtainable from /admin)
 */

import readline from 'readline';
import https from 'https';

const API_KEY = process.env.QUANTUM_API_KEY || '';
const ENDPOINT_URL = 'https://quantumqbit.in/api/mcp.php';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(id, result, error) {
  const res = { jsonrpc: '2.0', id };
  if (error) {
    res.error = error;
  } else {
    res.result = result;
  }
  process.stdout.write(JSON.stringify(res) + '\n');
}

function forwardToRemoteMcp(requestObj) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(requestObj);
    const url = new URL(ENDPOINT_URL);
    if (API_KEY) {
      url.searchParams.set('api_key', API_KEY);
    }

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(API_KEY ? { 'X-API-Key': API_KEY } : {})
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Invalid response from Quantum Qbit: ' + body));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch (e) {
    sendResponse(null, null, { code: -32700, message: 'Parse error' });
    return;
  }

  const { id, method } = msg;

  if (method === 'notifications/initialized') {
    return;
  }

  try {
    const remoteRes = await forwardToRemoteMcp(msg);
    if (remoteRes.error) {
      sendResponse(id, null, remoteRes.error);
    } else {
      sendResponse(id, remoteRes.result);
    }
  } catch (err) {
    sendResponse(id, null, {
      code: -32603,
      message: 'Quantum Qbit connection error: ' + err.message
    });
  }
});
