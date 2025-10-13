import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PostizApiClient } from '../postiz-api.js';

export type PostizToolArgs<Schema extends z.ZodRawShape> = z.infer<z.ZodObject<Schema>>;

export interface PostizToolContext {
    apiClient: PostizApiClient;
}

export interface PostizToolCliConfig {
    command: string;
    aliases?: string[];
    summary?: string;
}

export interface PostizToolDefinition<Schema extends z.ZodRawShape = z.ZodRawShape> {
    name: string;
    description: string;
    schema: Schema;
    cli?: PostizToolCliConfig;
    execute: (args: PostizToolArgs<Schema>, context: PostizToolContext) => Promise<CallToolResult>;
}
