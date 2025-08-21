import { z } from 'zod';
export function registerListPosts(server, apiClient) {
    server.tool('postiz-list-posts', 'List posts from Postiz with date range filtering', {
        startDate: z.string().describe('Start date in YYYY-MM-DD format'),
        endDate: z.string().describe('End date in YYYY-MM-DD format'),
        customer: z.string().optional().describe('Optional customer filter')
    }, async (args) => {
        try {
            const { startDate, endDate, customer } = args;
            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
                throw new Error('Invalid date format. Use YYYY-MM-DD format for both startDate and endDate');
            }
            const query = {
                startDate,
                endDate,
                ...(customer && { customer })
            };
            const posts = await apiClient.listPosts(query);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            posts: posts,
                            count: posts.length,
                            dateRange: {
                                startDate,
                                endDate
                            }
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
//# sourceMappingURL=list-posts.js.map