#!/usr/bin/env node

import { Command, Option } from 'commander';
import { z, ZodTypeAny } from 'zod';
import { PostizApiClient } from './postiz-api.js';
import type { AnyPostizToolDefinition } from './tools/definitions.js';
import { getChannelsTool } from './tools/get-channels.js';
import { uploadFileTool } from './tools/upload-file.js';
import { listPostsTool } from './tools/list-posts.js';
import { createPostTool } from './tools/create-post.js';
import { updatePostTool } from './tools/update-post.js';
import { deletePostTool } from './tools/delete-post.js';

const DEFAULT_BASE_URL = 'https://api.postiz.com/public/v1';
const ENVIRONMENT_HELP_TEXT = `Environment variables:
  POSTIZ_API_KEY    Postiz API key (alternative to --api-key)
  POSTIZ_BASE_URL   Override the API base URL
  POSTIZ_CLI_DEBUG  Include stack traces on errors`;

interface GlobalOptions {
    apiKey?: string;
    baseUrl?: string;
    pretty?: boolean;
}

function toKebabCase(value: string): string {
    return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
}

function wrapOutput(content: unknown, pretty = false, isError = false) {
    const payload = content instanceof Error
        ? {
              success: false,
              error: {
                  message: content.message,
                  stack: process.env.POSTIZ_CLI_DEBUG ? content.stack : undefined,
              },
          }
        : content;

    const output = pretty
        ? JSON.stringify(payload, null, 2)
        : JSON.stringify(payload);

    if (isError) {
        console.error(output);
    } else {
        console.log(output);
    }
}

function buildApiClient(options: GlobalOptions) {
    const apiKey = options.apiKey || process.env.POSTIZ_API_KEY;

    if (!apiKey) {
        throw new Error('POSTIZ_API_KEY is required. Provide it via --api-key or environment variable.');
    }

    const baseUrl = options.baseUrl || process.env.POSTIZ_BASE_URL || DEFAULT_BASE_URL;

    return new PostizApiClient(apiKey, baseUrl);
}

interface CommandOverrides {
    name?: string;
    description?: string;
    aliases?: string[];
}

function configureToolCommand(parent: Command, tool: AnyPostizToolDefinition, overrides: CommandOverrides = {}) {
    const commandName = overrides.name ?? tool.cli?.command ?? tool.name;
    const commandDescription = overrides.description ?? tool.cli?.summary ?? tool.description;
    const command = parent.command(commandName).description(commandDescription);

    const aliasCandidates = [
        ...(overrides.aliases ?? []),
        ...(tool.cli?.aliases ?? []),
        ...(commandName !== tool.name ? [tool.name] : []),
    ];

    const uniqueAliases = [...new Set(aliasCandidates)].filter((alias) => alias !== commandName);

    if (uniqueAliases.length > 0) {
        command.aliases(uniqueAliases);
    }
    const schemaObject = z.object(tool.schema);
    const schemaEntries = Object.entries(tool.schema) as Array<[string, ZodTypeAny]>;

    schemaEntries.forEach(([key, fieldSchema]) => {
        let optional = false;
        let schema = fieldSchema;

        if (schema instanceof z.ZodOptional) {
            optional = true;
            schema = schema.unwrap();
        }

        const flag = `--${toKebabCase(String(key))}`;
        let description = schema.description || fieldSchema.description || '';

        if (schema instanceof z.ZodEnum && !description) {
            description = 'Select one of the available choices';
        }

        const option = new Option(`${flag} <value>`, description);

        if (!optional) {
            option.makeOptionMandatory();
        }

        if (schema instanceof z.ZodArray && schema.element instanceof z.ZodString) {
            // Repeated flag collects array values.
            option.argParser((input: string, previous: string[] | undefined) => {
                const values = previous ? [...previous] : [];
                values.push(input);
                return values;
            });
            command.addOption(option);
            return;
        }

        if (schema instanceof z.ZodEnum) {
            option.choices([...schema.options]);
            command.addOption(option);
            return;
        }

        if (schema instanceof z.ZodString) {
            command.addOption(option);
            return;
        }

        throw new Error(`Unsupported schema type for field ${String(key)}`);
    });

    command.action(async (commandOptions, cmd) => {
        const globalOptions = cmd.optsWithGlobals() as GlobalOptions;
        const pretty = Boolean(globalOptions.pretty);

        try {
            const apiClient = buildApiClient(globalOptions);

            const rawArgs: Record<string, unknown> = {};

            schemaEntries.forEach(([key, fieldSchema]) => {
                let optional = false;
                let schema = fieldSchema;

                if (schema instanceof z.ZodOptional) {
                    optional = true;
                    schema = schema.unwrap();
                }

                const value = commandOptions[key as string];

                if (schema instanceof z.ZodArray && schema.element instanceof z.ZodString) {
                    if (Array.isArray(value) && value.length > 0) {
                        rawArgs[key as string] = value;
                    } else if (!optional && value === undefined) {
                        rawArgs[key as string] = value;
                    }
                    return;
                }

                if (value !== undefined) {
                    rawArgs[key as string] = value;
                }
            });

            const validation = schemaObject.safeParse(rawArgs);

            if (!validation.success) {
                wrapOutput(
                    {
                        success: false,
                        error: {
                            message: 'Invalid arguments for tool',
                            issues: validation.error.issues,
                        },
                    },
                    pretty,
                    true
                );
                process.exitCode = 1;
                return;
            }

            const result = await tool.execute(validation.data as any, { apiClient });

            const firstContent = result.content?.[0];
            if (firstContent && firstContent.type === 'text') {
                try {
                    const parsed = JSON.parse(firstContent.text);
                    wrapOutput(parsed, pretty, result.isError === true);
                    process.exitCode = result.isError ? 1 : 0;
                    return;
                } catch (error) {
                    wrapOutput(
                        {
                            success: result.isError !== true,
                            raw: result,
                            parseError: error instanceof Error ? error.message : String(error),
                        },
                        pretty,
                        result.isError === true
                    );
                    process.exitCode = result.isError ? 1 : 0;
                    return;
                }
            }

            wrapOutput(
                {
                    success: result.isError !== true,
                    result,
                },
                pretty,
                result.isError === true
            );
            process.exitCode = result.isError ? 1 : 0;
        } catch (error) {
            wrapOutput(error instanceof Error ? error : new Error(String(error)), pretty, true);
            process.exitCode = 1;
        }
    });
}

async function main(argv: string[]) {
    const program = new Command();

    program
        .name('postiz')
        .description('CLI for Postiz tools')
        .option('--api-key <key>', 'Postiz API key (POSTIZ_API_KEY)')
        .option('--base-url <url>', 'Base URL for the Postiz API (POSTIZ_BASE_URL)')
        .option('--pretty', 'Pretty-print JSON output');

    program.showHelpAfterError();

    const postsCommand = program
        .command('posts')
        .description('Manage posts in Postiz')
        .alias('post');

    configureToolCommand(postsCommand, listPostsTool, {
        name: 'list',
    });

    configureToolCommand(postsCommand, createPostTool, {
        name: 'create',
    });

    configureToolCommand(postsCommand, updatePostTool, {
        name: 'update',
    });

    configureToolCommand(postsCommand, deletePostTool, {
        name: 'delete',
    });

    configureToolCommand(program, getChannelsTool, {
        name: 'channels',
    });

    configureToolCommand(program, uploadFileTool, {
        name: 'upload',
        description: 'Upload a file to Postiz for use in posts (images, videos, etc.)',
    });

    program.addHelpText(
        'afterAll',
        `\n${ENVIRONMENT_HELP_TEXT}\n`
    );

    await program.parseAsync(argv);
}

main(process.argv).catch((error) => {
    wrapOutput(error instanceof Error ? error : new Error(String(error)), Boolean(process.env.POSTIZ_CLI_DEBUG), true);
    process.exit(1);
});
