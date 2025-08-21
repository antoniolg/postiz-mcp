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
const apiClient = new PostizApiClient(process.env.POSTIZ_API_KEY, baseUrl);
const server = new McpServer({
    name: 'postiz-mcp',
    version: '1.0.0',
    description: 'Postiz API MCP Server'
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
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map