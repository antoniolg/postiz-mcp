import { getChannelsTool } from './get-channels.js';
import { uploadFileTool } from './upload-file.js';
import { listPostsTool } from './list-posts.js';
import { createPostTool } from './create-post.js';
import { updatePostTool } from './update-post.js';
import { deletePostTool } from './delete-post.js';

export const postizTools = [
    getChannelsTool,
    uploadFileTool,
    listPostsTool,
    createPostTool,
    updatePostTool,
    deletePostTool
] as const;

export type PostizToolName = (typeof postizTools)[number]['name'];
export type AnyPostizToolDefinition = (typeof postizTools)[number];
