export function registerGetChannels(server, apiClient) {
    server.tool('postiz-get-channels', 'Get list of available social media channels/integrations in Postiz', {
    // No parameters needed for this endpoint
    }, async () => {
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
//# sourceMappingURL=get-channels.js.map