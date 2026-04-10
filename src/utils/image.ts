/**
 * Convert an image reference (URL or file ID) into the payload
 * expected by the Postiz API.
 *
 * - URLs (http/https) are kept as `path`; `id` is left empty because
 *   the backend resolves the image from the URL directly.
 * - File IDs (returned by the upload endpoint) are set as `id` so the
 *   backend can look them up via `_mediaService.getMediaById`.
 */
export function toImagePayload(img: string): { id: string; path: string } {
    const lower = img.toLowerCase();
    const isUrl = lower.startsWith('http://') || lower.startsWith('https://');
    return {
        id: isUrl ? '' : img,
        path: img
    };
}
