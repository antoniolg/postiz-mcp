import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { z } from 'zod';
import { PostizToolDefinition } from './tool-definition.js';

const schema = {} satisfies z.ZodRawShape;

export const getChannelsTool: PostizToolDefinition<typeof schema> = {
    name: 'postiz-get-channels',
    description: 'Get list of available social media channels/integrations in Postiz',
    schema,
    cli: {
        command: 'channels',
        aliases: ['get-channels']
    },
    execute: async (_args, { apiClient }) => {
        try {
            const channels = await apiClient.getChannels();

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            channels,
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
};

export function registerGetChannels(server: McpServer, apiClient: PostizApiClient) {
    server.tool(
        getChannelsTool.name,
        getChannelsTool.description,
        getChannelsTool.schema,
        async (args) => getChannelsTool.execute(args, { apiClient })
    );
}
