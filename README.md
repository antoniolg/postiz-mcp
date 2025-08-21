# Postiz MCP Server

A Model Context Protocol (MCP) server for the [Postiz](https://postiz.com) social media scheduling API. This server allows AI assistants to interact with Postiz to manage social media posts across multiple platforms.

## Features

- **Get Channels**: List available social media integrations
- **Upload Files**: Upload images and media for posts
- **List Posts**: Query posts with date range filtering
- **Create Posts**: Create draft, scheduled, or immediate posts
- **Update Posts**: Modify existing posts
- **Delete Posts**: Remove posts
- **Generate Videos**: AI video generation with slides or prompts (Beta)

## Supported Platforms

Postiz supports posting to: X (Twitter), LinkedIn, LinkedIn Pages, Reddit, Instagram (Facebook Business), Instagram (Standalone), Facebook Pages, Threads, YouTube, TikTok, Pinterest, Dribbble, Discord, Slack, Mastodon, Bluesky, Lemmy, Warpcast, Telegram, Nostr, VK, Medium, Dev.to, Hashnode, and WordPress.

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
POSTIZ_API_KEY=your_postiz_api_key_here
POSTIZ_BASE_URL=https://api.postiz.com/public/v1  # Optional, defaults to hosted Postiz
```

### Getting Your API Key

1. Log into your Postiz account
2. Go to Settings > API Keys
3. Generate a new API key
4. Copy the key to your `.env` file

**Note**: The Postiz API has a rate limit of 30 requests per hour.

## Usage with Claude Desktop

Add this to your Claude Desktop configuration file:

### Windows
`%APPDATA%\Claude\claude_desktop_config.json`

### macOS
`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "postiz": {
      "command": "node",
      "args": ["/path/to/postiz-mcp/build/index.js"],
      "env": {
        "POSTIZ_API_KEY": "your_postiz_api_key_here"
      }
    }
  }
}
```

## Available Tools

### postiz-get-channels
Get list of available social media channels/integrations.
```
No parameters required
```

### postiz-upload-file
Upload a file for use in posts.
```
- filePath: string (required) - Path to the file to upload
- filename: string (optional) - Custom filename
```

### postiz-list-posts
List posts with date range filtering.
```
- startDate: string (required) - Start date in YYYY-MM-DD format
- endDate: string (required) - End date in YYYY-MM-DD format
- customer: string (optional) - Customer filter
```

### postiz-create-post
Create a new post.
```
- content: string (required) - Post text content
- integrations: string[] (required) - Array of channel IDs
- status: 'draft' | 'scheduled' | 'now' (optional, default: 'draft')
- scheduledDate: string (optional) - ISO 8601 date for scheduling
- images: string[] (optional) - Array of image URLs/file IDs
```

### postiz-update-post
Update an existing post.
```
- id: string (required) - Post ID to update
- content: string (optional) - New content
- integrations: string[] (optional) - New channel IDs
- status: 'draft' | 'scheduled' | 'now' (optional) - New status
- scheduledDate: string (optional) - New schedule date
- images: string[] (optional) - New images
```

### postiz-delete-post
Delete a post.
```
- id: string (required) - Post ID to delete
```

### postiz-generate-video
Generate AI video (Beta feature).
```
- slides: object[] (optional) - Array of slide objects with image and text
- prompt: string (optional) - Text prompt for AI generation
- voice: string (optional) - Voice setting
- duration: number (optional) - Duration in seconds
```

## Example Usage

### Creating a Post
```
Use postiz-create-post with:
- content: "Hello from my AI assistant! 🤖"
- integrations: ["twitter_channel_id", "linkedin_channel_id"]
- status: "now"
```

### Scheduling a Post
```
Use postiz-create-post with:
- content: "Scheduled post content"
- integrations: ["twitter_channel_id"]
- status: "scheduled"
- scheduledDate: "2024-01-15T10:00:00Z"
```

### Uploading and Using Images
```
1. Use postiz-upload-file with filePath: "/path/to/image.jpg"
2. Use the returned file ID in postiz-create-post images array
```

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev  # Builds with watch mode
```

### Format Code
```bash
npm run format
```

## API Rate Limits

Postiz API has a rate limit of 30 requests per hour. The MCP server will handle rate limit errors gracefully and return appropriate error messages.

## Self-Hosted Postiz

If you're using a self-hosted Postiz instance, set the `POSTIZ_BASE_URL` environment variable:

```env
POSTIZ_BASE_URL=https://your-postiz-instance.com/public/v1
```

## Error Handling

All tools return structured JSON responses with:
- `success`: boolean indicating if the operation succeeded
- `error`: error message if operation failed
- `statusCode`: HTTP status code for API errors
- Data fields specific to each operation

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request