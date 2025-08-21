#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PostizApiClient } from './postiz-api.js';
import { registerGetChannels } from './tools/get-channels.js';
import { registerUploadFile } from './tools/upload-file.js';
import { registerListPosts } from './tools/list-posts.js';
import { registerCreatePost } from './tools/create-post.js';
import { registerUpdatePost } from './tools/update-post.js';
import { registerDeletePost } from './tools/delete-post.js';
if (!process.env.POSTIZ_API_KEY) {
    console.error('Error: POSTIZ_API_KEY environment variable is required');
    process.exit(1);
}
const baseUrl = process.env.POSTIZ_BASE_URL || 'https://api.postiz.com/public/v1';
console.error(`Using Postiz API base URL: ${baseUrl}`);
console.error(`Using API Key: ${process.env.POSTIZ_API_KEY?.substring(0, 8)}...`);
const apiClient = new PostizApiClient(process.env.POSTIZ_API_KEY, baseUrl);
const server = new McpServer({
    name: 'postiz-mcp',
    version: '1.0.0',
    description: 'Postiz API MCP Server - IMPORTANT NOTES: 1) For scheduling, use local timezone format (YYYY-MM-DDTHH:mm:ss) not UTC. 2) For images, use public URLs from upload response, not file IDs. 3) Comments in posts are additional items in the content array.'
}, {
    capabilities: {
        tools: {},
    },
});
// Register all tools
registerGetChannels(server, apiClient);
registerUploadFile(server, apiClient);
registerListPosts(server, apiClient);
registerCreatePost(server, apiClient);
registerUpdatePost(server, apiClient);
registerDeletePost(server, apiClient);
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Postiz MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map