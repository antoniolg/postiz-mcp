import { PostizApiClientAlternative } from '../postiz-api-alternative.js';
import { log } from '../logger.js';
export function registerTestStrategies(server, baseUrl, apiKey) {
    server.tool('postiz-test-strategies', 'Test different authentication strategies to find the working one', {}, async () => {
        try {
            log('INFO', 'Starting strategy testing');
            const altClient = new PostizApiClientAlternative(apiKey, baseUrl);
            const result = await altClient.tryAllStrategies();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            workingStrategy: result.strategy,
                            channels: result.result,
                            message: `Found working strategy: ${result.strategy}`
                        }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            log('ERROR', 'All strategies failed', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                            message: 'All authentication strategies failed. Check the log file for details.'
                        }, null, 2)
                    }
                ],
                isError: true
            };
        }
    });
}
//# sourceMappingURL=test-strategies.js.map