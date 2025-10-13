import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PostizApiClient } from '../postiz-api.js';
import { postizTools, type AnyPostizToolDefinition } from '../tools/definitions.js';

export function registerPostizTools(
    server: McpServer,
    apiClient: PostizApiClient,
    tools: ReadonlyArray<AnyPostizToolDefinition> = postizTools
) {
    tools.forEach((tool) => {
        server.tool(
            tool.name,
            tool.description,
            tool.schema,
            async (args: unknown, _extra: unknown) => tool.execute(args as any, { apiClient })
        );
    });
}
