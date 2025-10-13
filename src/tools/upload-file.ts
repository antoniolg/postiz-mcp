import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { z } from 'zod';
import * as fs from 'fs';
import { PostizToolDefinition } from './tool-definition.js';

const schema = {
    filePath: z.string().describe('Path to the file to upload'),
    filename: z.string().optional().describe('Custom filename (optional, will use original filename if not provided). IMPORTANT: The response will include a public URL that should be used in postiz-create-post images parameter, NOT the file ID.')
} satisfies z.ZodRawShape;

export const uploadFileTool: PostizToolDefinition<typeof schema> = {
    name: 'postiz-upload-file',
    description: 'Upload a file to Postiz for use in posts (images, videos, etc.)',
    schema,
    execute: async ({ filePath, filename }, { apiClient }) => {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const fileBuffer = fs.readFileSync(filePath);
            const finalFilename = filename || filePath.split('/').pop() || 'uploaded-file';

            const result = await apiClient.uploadFile(fileBuffer, finalFilename);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                success: true,
                                file: result,
                                message: `File "${finalFilename}" uploaded successfully`
                            },
                            null,
                            2
                        )
                    }
                ]
            };
        } catch (error: any) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                success: false,
                                error: error.response?.data?.message || error.message,
                                statusCode: error.response?.status
                            },
                            null,
                            2
                        )
                    }
                ],
                isError: true
            };
        }
    }
};

export function registerUploadFile(server: McpServer, apiClient: PostizApiClient) {
    server.tool(
        uploadFileTool.name,
        uploadFileTool.description,
        uploadFileTool.schema,
        async (args) => uploadFileTool.execute(args, { apiClient })
    );
}
