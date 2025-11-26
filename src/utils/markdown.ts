export function convertMarkdownToHtml(text: string): string {
    // If the text already looks like HTML (starts with a tag), leave it alone.
    // This is a simple heuristic.
    const trimmed = text.trim();
    if (trimmed.startsWith('<p') || trimmed.startsWith('<div') || trimmed.startsWith('<span')) {
        return text;
    }

    // Check if there is any Markdown bolding before converting
    if (!text.includes('**')) {
        return text; // No Markdown bolding found, return original text
    }

    const lines = text.split('\n');
    const htmlLines = lines.map(line => {
        // Handle empty lines
        if (!line.trim()) {
            return '<p></p>';
        }

        // Handle Bold: **text** -> <strong>text</strong>
        // We use a regex that handles multiple occurrences
        let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Wrap in paragraph
        return `<p>${processedLine}</p>`;
    });

    return htmlLines.join('');
}