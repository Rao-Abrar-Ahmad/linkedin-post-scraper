import { Router, Request, Response, NextFunction } from 'express';
import { scrapeLinkedInPost } from '../scraper/linkedin';
import { ScraperException } from '../scraper/types';

const router = Router();

// Express async handler helper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

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

/**
 * GET /api/mcp
 * Returns MCP Server metadata & supported tool definitions.
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'lps-mcp-server',
    version: '1.0.0',
    description: 'Model Context Protocol (MCP) Server for LinkedIn Post Scraper',
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {
        listChanged: false
      }
    },
    tools: [MCP_TOOL_DEFINITION]
  });
});

/**
 * POST /api/mcp
 * Handles JSON-RPC 2.0 MCP requests or direct tool invocation for AI Agents.
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body || {};

    // 1. Check if JSON-RPC 2.0 request
    if (body.jsonrpc === '2.0') {
      const { id, method, params } = body;

      // Handle 'initialize' method
      if (method === 'initialize') {
        return res.status(200).json({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'lps-mcp-server',
              version: '1.0.0'
            }
          }
        });
      }

      // Handle 'tools/list' method
      if (method === 'tools/list') {
        return res.status(200).json({
          jsonrpc: '2.0',
          id: id ?? 1,
          result: {
            tools: [MCP_TOOL_DEFINITION]
          }
        });
      }

      // Handle 'tools/call' method
      if (method === 'tools/call') {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        const url = toolArgs.url;

        if (toolName !== 'scrape_linkedin_post') {
          return res.status(200).json({
            jsonrpc: '2.0',
            id: id ?? 1,
            error: {
              code: -32601,
              message: `Unknown tool: ${toolName}`
            }
          });
        }

        if (!url || typeof url !== 'string') {
          return res.status(200).json({
            jsonrpc: '2.0',
            id: id ?? 1,
            error: {
              code: -32602,
              message: 'Missing required string parameter: url'
            }
          });
        }

        try {
          console.log(`[MCP] Scrape request via JSON-RPC tools/call for: ${url}`);
          const postData = await scrapeLinkedInPost(url);
          const smp = postData.socialMediaPosting;

          const formattedText = smp ? `
# LinkedIn Post by ${smp.author?.name || 'LinkedIn Member'}
${smp.headline ? `*${smp.headline}*\n` : ''}
**URL:** ${smp.url || url}
**Date:** ${smp.datePublished || 'Recent'}

---

${smp.articleBody || 'No text body'}

---
- Likes: ${smp.interactionStatistic?.find((s: any) => s.interactionType?.includes('Like'))?.userInteractionCount ?? 0}
- Comments: ${smp.commentCount ?? 0}
- Media Attached: ${Array.isArray(smp.image) ? smp.image.length : (smp.image ? 1 : 0)}
          `.trim() : JSON.stringify(postData, null, 2);

          return res.status(200).json({
            jsonrpc: '2.0',
            id: id ?? 1,
            result: {
              content: [
                {
                  type: 'text',
                  text: formattedText
                }
              ],
              structuredData: postData
            }
          });
        } catch (err: any) {
          return res.status(200).json({
            jsonrpc: '2.0',
            id: id ?? 1,
            error: {
              code: -32000,
              message: err.message || 'Scraping failed'
            }
          });
        }
      }

      // Default ping / notifications
      if (method === 'ping') {
        return res.status(200).json({ jsonrpc: '2.0', id: id ?? 1, result: {} });
      }

      return res.status(200).json({
        jsonrpc: '2.0',
        id: id ?? 1,
        error: { code: -32601, message: `Method not supported: ${method}` }
      });
    }

    // 2. Direct HTTP JSON request ({ "url": "..." } or { "name": "scrape_linkedin_post", "arguments": { "url": "..." } })
    const targetUrl = body.url || body.arguments?.url;

    if (!targetUrl || typeof targetUrl !== 'string') {
      throw new ScraperException('INVALID_URL', 'Required parameter "url" missing or invalid.');
    }

    console.log(`[MCP] Direct HTTP scrape request for: ${targetUrl}`);
    const postData = await scrapeLinkedInPost(targetUrl);

    res.status(200).json({
      success: true,
      mcpTool: 'scrape_linkedin_post',
      data: postData
    });
  })
);

export default router;
