import readline from 'readline';
import { scrapeLinkedInPost } from './scraper/linkedin';

/**
 * MCP Stdio Server for LinkedIn Post Scraper
 * Listens for JSON-RPC 2.0 requests on stdin and outputs responses to stdout.
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const MCP_TOOL_DEFINITION = {
  name: 'scrape_linkedin_post',
  description: 'Scrape and extract text content, author details, high-resolution attached images, and reaction metrics from any public LinkedIn post URL.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The public LinkedIn post URL to scrape (e.g. https://www.linkedin.com/posts/...)'
      }
    },
    required: ['url']
  }
};

function sendJsonRpcResponse(response: object) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

rl.on('line', async (line) => {
  if (!line.trim()) return;

  try {
    const request = JSON.parse(line);
    const { jsonrpc, id, method, params } = request;

    if (jsonrpc !== '2.0') return;

    if (method === 'initialize') {
      sendJsonRpcResponse({
        jsonrpc: '2.0',
        id: id ?? 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'lps-mcp-stdio-server', version: '1.0.0' }
        }
      });
      return;
    }

    if (method === 'tools/list') {
      sendJsonRpcResponse({
        jsonrpc: '2.0',
        id: id ?? 1,
        result: { tools: [MCP_TOOL_DEFINITION] }
      });
      return;
    }

    if (method === 'tools/call') {
      const name = params?.name;
      const args = params?.arguments || {};

      if (name !== 'scrape_linkedin_post' || !args.url) {
        sendJsonRpcResponse({
          jsonrpc: '2.0',
          id: id ?? 1,
          error: { code: -32602, message: 'Invalid tool name or missing "url" argument.' }
        });
        return;
      }

      try {
        const postData = await scrapeLinkedInPost(args.url);
        const smp = postData.socialMediaPosting;

        const formattedText = smp ? `
# LinkedIn Post by ${smp.author?.name || 'LinkedIn Member'}
${smp.headline ? `*${smp.headline}*\n` : ''}
**URL:** ${smp.url || args.url}
**Date:** ${smp.datePublished || 'Recent'}

---

${smp.articleBody || 'No text body'}

---
- Likes: ${smp.interactionStatistic?.find((s: any) => s.interactionType?.includes('Like'))?.userInteractionCount ?? 0}
- Comments: ${smp.commentCount ?? 0}
        `.trim() : JSON.stringify(postData, null, 2);

        sendJsonRpcResponse({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: {
            content: [{ type: 'text', text: formattedText }]
          }
        });
      } catch (err: any) {
        sendJsonRpcResponse({
          jsonrpc: '2.0',
          id: id ?? 1,
          error: { code: -32000, message: err.message || 'Scraping failed.' }
        });
      }
      return;
    }

    if (method === 'ping') {
      sendJsonRpcResponse({ jsonrpc: '2.0', id: id ?? 1, result: {} });
      return;
    }

    sendJsonRpcResponse({
      jsonrpc: '2.0',
      id: id ?? 1,
      error: { code: -32601, message: `Unsupported method: ${method}` }
    });

  } catch (e) {
    // Ignore invalid non-JSON lines
  }
});
