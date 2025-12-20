# Postiz MCP Server & CLI

A Model Context Protocol (MCP) server **and** command-line interface for the [Postiz](https://postiz.com) social media scheduling API. Both entrypoints share the same tool definitions so that AI assistants and human operators can manage social media posts across multiple platforms with identical capabilities.

## Features

- **Command-line interface**: `postiz` binary with `--help` output designed for humans and LLMs
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

## Using the CLI

> The CLI and the MCP server share the same environment variables (`POSTIZ_API_KEY`, `POSTIZ_BASE_URL`). Configure them once and they will work in both contexts.

### Quick test without installation

```bash
npx tsx src/cli.ts --help
```

### Install the `postiz` binary

```bash
npm run build
npm_config_prefix="$HOME/.npm-global" npm link   # Or just `npm link` if you have system permissions
```

Make sure `$(npm config get prefix)/bin` (e.g. `~/.npm-global/bin`) is in your `PATH`, then run:

```bash
postiz --help
postiz posts --start-date 2024-10-01 --end-date 2024-10-07 --pretty
```

### Hot reload during development

```bash
npm run dev:cli -- --help
```

The watcher re-runs the CLI with the same arguments every time you save a file under `src/`.

## Configuration

### Environment Variables

Set the variables in your shell profile (`~/.zshrc`, `~/.bash_profile`, etc.) or create a `.env` file with the following values:

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

All commands exposed by the MCP server are available in the CLI. Run `postiz --help` to see the full list and `postiz <tool-name> --help` to inspect the parameters (help text is generated automatically from the Zod schema).

### postiz-get-channels (CLI: `postiz channels`)
Get list of available social media channels/integrations.
```
No parameters required
```

### postiz-upload-file (CLI: `postiz upload`)
Upload a file for use in posts.
```
- filePath: string (required) - Path to the file to upload
- filename: string (optional) - Custom filename
```

### postiz-list-posts (CLI: `postiz posts`)
List posts with date range filtering.
```
- startDate: string (required) - Start date in YYYY-MM-DD or ISO 8601 datetime (date-only expands to 00:00:00)
- endDate: string (required) - End date in YYYY-MM-DD or ISO 8601 datetime (date-only expands to 23:59:59.999)
- customer: string (optional) - Customer filter
```

### postiz-create-post (CLI: `postiz create`)
Create a new post.
```
- content: string (required) - Post text content
- integrations: string[] (required) - Array of channel IDs
- status: 'draft' | 'scheduled' | 'now' (optional, default: 'draft')
- scheduledDate: string (optional) - ISO 8601 date for scheduling
- images: string[] (optional) - Array of image URLs/file IDs
```

### postiz-update-post (CLI: `postiz update`)
Update an existing post. IMPORTANT: updates are not partial; include the full content again or it will be cleared.
```
- id: string (required) - Post ID to update
- content: string (optional) - Full content (send all text again, even if unchanged)
- integrations: string[] (optional) - New channel IDs
- status: 'draft' | 'scheduled' | 'now' (optional) - New status
- scheduledDate: string (optional) - New schedule date
- images: string[] (optional) - New images
```

### postiz-delete-post (CLI: `postiz delete`)
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

## Example Usage (CLI)

```bash
# Create an immediate post
postiz create \
  --content "Hello from my AI assistant! 🤖" \
  --integrations twitter_channel_id \
  --integrations linkedin_channel_id \
  --status now

# Schedule a post
postiz create \
  --content "Scheduled post content" \
  --integrations twitter_channel_id \
  --status scheduled \
  --scheduled-date "2024-01-15T10:00:00+01:00"

# Upload an image and reuse it
postiz upload --file-path /path/to/image.jpg --pretty
# Use the returned URL in the --images array when calling `postiz create`
```

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
# Rebuilds and restarts the MCP server in watch mode
npm run dev

# Iterate on the CLI without rebuilding the output in build/
npm run dev:cli -- --help
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
