# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Build the project (TypeScript compilation + executable permissions)
npm run build

# Development with watch mode
npm run dev

# Format code with Prettier
npm run format

# Start the MCP server (requires build first)
npm start
```

## Architecture Overview

This is a Model Context Protocol (MCP) server that provides AI assistants access to the Postiz social media scheduling API. The codebase follows a modular tool-based architecture:

### Core Components

- **`src/index.ts`**: Main entry point that initializes the MCP server, registers all tools, and handles stdio transport
- **`src/postiz-api.ts`**: API client wrapper for Postiz REST API with typed interfaces and error handling
- **`src/tools/`**: Individual MCP tools, each implementing a specific Postiz API operation

### Tool Architecture Pattern

Each tool in `src/tools/` follows the same pattern:
1. Exports a `register*` function that registers the tool with the MCP server
2. Uses Zod schemas for parameter validation
3. Returns structured JSON responses with `success/error` fields
4. Handles API errors gracefully with proper error messages and status codes

### API Client Design

The `PostizApiClient` class:
- Uses Axios with interceptors for error handling
- Detects HTML responses (authentication failures) and converts them to proper errors
- Supports both hosted Postiz and self-hosted instances via `POSTIZ_BASE_URL`
- Implements proper TypeScript interfaces for all API operations

## Environment Variables

Required:
- `POSTIZ_API_KEY`: Your Postiz API key

Optional:
- `POSTIZ_BASE_URL`: Custom Postiz instance URL (defaults to `https://api.postiz.com/public/v1`)

## Important Implementation Details

### Instagram Integration
Posts must include `post_type: "post"` in the settings object for Instagram channels. This is automatically handled in the create-post tool.

### Immediate Posting
When using `status: "now"`, the API requires a `date` field set to the current ISO timestamp. The create-post tool handles this automatically.

### File Uploads
The upload-file tool returns both file ID and public URL. For creating posts, use the public URL in the `images` array, not the file ID.

### Rate Limiting
Postiz API has a 30 requests/hour limit. All tools return proper error messages when rate limits are exceeded.

## Build Process

The build process compiles TypeScript to `build/` directory and makes the main file executable. The `.gitignore` excludes the build directory from version control since it's generated.