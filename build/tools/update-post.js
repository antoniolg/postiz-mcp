import { z } from 'zod';
export function registerUpdatePost(server, apiClient) {
    server.tool('postiz-update-post', 'Update an existing post in Postiz', {
        id: z.string().describe('The ID of the post to update'),
        content: z.string().optional().describe('New text content for the post'),
        integrations: z.array(z.string()).optional().describe('New array of channel/integration IDs'),
        status: z.enum(['draft', 'scheduled', 'now']).optional().describe('New post status'),
        scheduledDate: z.string().optional().describe('New ISO 8601 date string for scheduling'),
        images: z.array(z.string()).optional().describe('New array of image URLs or file IDs')
    }, async (args) => {
        try {
            const { id, content, integrations, status, scheduledDate, images } = args;
            if (!id.trim()) {
                throw new Error('Post ID is required');
            }
            // Build update object with only provided fields
            const updateData = {};
            if (content !== undefined) {
                if (!content.trim()) {
                    throw new Error('Post content cannot be empty');
                }
                updateData.content = content;
            }
            if (integrations !== undefined) {
                if (!integrations || integrations.length === 0) {
                    throw new Error('At least one integration/channel ID is required');
                }
                updateData.integrations = integrations;
            }
            if (status !== undefined) {
                updateData.status = status;
                // Validate scheduled date if status is scheduled
                if (status === 'scheduled') {
                    if (!scheduledDate) {
                        throw new Error('scheduledDate is required when status is "scheduled"');
                    }
                    const scheduleDateTime = new Date(scheduledDate);
                    if (isNaN(scheduleDateTime.getTime())) {
                        throw new Error('Invalid scheduledDate format. Use ISO 8601 format');
                    }
                    if (scheduleDateTime <= new Date()) {
                        throw new Error('scheduledDate must be in the future');
                    }
                }
            }
            if (scheduledDate !== undefined) {
                updateData.scheduledDate = scheduledDate;
            }
            if (images !== undefined) {
                updateData.images = images;
            }
            // Check if at least one field is being updated
            if (Object.keys(updateData).length === 0) {
                throw new Error('At least one field must be provided for update');
            }
            const result = await apiClient.updatePost(id, updateData);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            post: result,
                            message: `Post ${id} updated successfully`
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
//# sourceMappingURL=update-post.js.map