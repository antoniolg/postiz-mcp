import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { z } from 'zod';

export function registerDeletePost(server: McpServer, apiClient: PostizApiClient) {
    server.tool(
        'postiz-delete-post',
        'Delete a post from Postiz',
        {
            id: z.string().describe('The ID of the post to delete')
        },
        async (args) => {
            try {
                const { id } = args;
                
                if (!id.trim()) {
                    throw new Error('Post ID is required');
                }
                
                await apiClient.deletePost(id);
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                message: `Post ${id} deleted successfully`
                            }, null, 2)
                        }
                    ]
                };
            } catch (error: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: error.response?.data?.message || error.message,
                                statusCode: error.response?.status
                            }, null, 2)
                        }
                    ],
                    isError: true
                };
            }
        }
    );
}