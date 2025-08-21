import { z } from 'zod';
export function registerGenerateVideo(server, apiClient) {
    server.tool('postiz-generate-video', 'Generate an AI video using Postiz (Beta feature)', {
        slides: z.array(z.object({
            image: z.string().describe('Image URL or file ID for the slide'),
            text: z.string().optional().describe('Text overlay for the slide')
        })).optional().describe('Array of slide objects with images and optional text'),
        prompt: z.string().optional().describe('Text prompt for AI video generation'),
        voice: z.string().optional().describe('Voice setting for the video (if supported)'),
        duration: z.number().optional().describe('Duration of the video in seconds')
    }, async (args) => {
        try {
            const { slides, prompt, voice, duration } = args;
            // Validate that at least slides or prompt is provided
            if (!slides && !prompt) {
                throw new Error('Either slides or prompt must be provided for video generation');
            }
            if (slides && slides.length === 0) {
                throw new Error('If providing slides, at least one slide is required');
            }
            // Validate slides if provided
            if (slides) {
                for (let i = 0; i < slides.length; i++) {
                    if (!slides[i].image || !slides[i].image.trim()) {
                        throw new Error(`Slide ${i + 1} must have an image`);
                    }
                }
            }
            const videoData = {};
            if (slides) {
                videoData.slides = slides;
            }
            if (prompt) {
                videoData.prompt = prompt;
            }
            if (voice) {
                videoData.voice = voice;
            }
            if (duration) {
                if (duration <= 0) {
                    throw new Error('Duration must be greater than 0');
                }
                videoData.duration = duration;
            }
            const result = await apiClient.generateVideo(videoData);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            video: result,
                            message: 'Video generation request submitted successfully'
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
//# sourceMappingURL=generate-video.js.map