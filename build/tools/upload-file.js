import { z } from 'zod';
import * as fs from 'fs';
export function registerUploadFile(server, apiClient) {
    server.tool('postiz-upload-file', 'Upload a file to Postiz for use in posts (images, videos, etc.)', {
        filePath: z.string().describe('Path to the file to upload'),
        filename: z.string().optional().describe('Custom filename (optional, will use original filename if not provided). IMPORTANT: The response will include a public URL that should be used in postiz-create-post images parameter, NOT the file ID.')
    }, async (args) => {
        try {
            const { filePath, filename } = args;
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            // Read file as buffer
            const fileBuffer = fs.readFileSync(filePath);
            // Use provided filename or extract from path
            const finalFilename = filename || filePath.split('/').pop() || 'uploaded-file';
            const result = await apiClient.uploadFile(fileBuffer, finalFilename);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            file: result,
                            message: `File "${finalFilename}" uploaded successfully`
                        }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
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
    });
}
//# sourceMappingURL=upload-file.js.map