import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { z } from 'zod';

export function registerGetChannels(server: McpServer, apiClient: PostizApiClient) {
    server.tool(
        'postiz-get-channels',
        'Get list of available social media channels/integrations in Postiz',
        {
            // No parameters needed for this endpoint
        },
        async () => {
            try {
                const channels = await apiClient.getChannels();
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                channels: channels,
                                count: channels.length
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