#!/usr/bin/env node

import { Command } from 'commander';
import { z, ZodTypeAny } from 'zod';
import { PostizApiClient } from './postiz-api.js';
import { postizTools } from './tools/definitions.js';

const DEFAULT_BASE_URL = 'https://api.postiz.com/public/v1';

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

function configureToolCommand(root: Command, tool: (typeof postizTools)[number]) {
    const command = root.command(tool.name).description(tool.description);
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
        const description = schema.description || fieldSchema.description || '';

        if (schema instanceof z.ZodArray && schema.element instanceof z.ZodString) {
            // Repeated flag collects array values.
            command.option(
                `${flag} <value>`,
                description,
                (input: string, previous: string[] | undefined) => {
                    const values = previous ? [...previous] : [];
                    values.push(input);
                    return values;
                },
                optional ? undefined : []
            );
            return;
        }

        if (schema instanceof z.ZodEnum) {
            const choices = schema.options.join(', ');
            command.option(
                `${flag} <value>`,
                description ? `${description} (choices: ${choices})` : `choices: ${choices}`
            );
            return;
        }

        if (schema instanceof z.ZodString) {
            command.option(`${flag} <value>`, description);
            return;
        }

        throw new Error(`Unsupported schema type for field ${String(key)}`);
    });

    command.action(async (commandOptions) => {
        const globalOptions = root.optsWithGlobals() as GlobalOptions;
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

    postizTools.forEach((tool) => {
        configureToolCommand(program, tool);
    });

    program.addHelpText(
        'afterAll',
        `\nEnvironment variables:\n  POSTIZ_API_KEY    Postiz API key (alternative to --api-key)\n  POSTIZ_BASE_URL   Override the API base URL\n  POSTIZ_CLI_DEBUG  Include stack traces on errors\n`
    );

    await program.parseAsync(argv);
}

main(process.argv).catch((error) => {
    wrapOutput(error instanceof Error ? error : new Error(String(error)), Boolean(process.env.POSTIZ_CLI_DEBUG), true);
    process.exit(1);
});
