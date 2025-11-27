export type Block = {
    id: string;
    type: string;
    props: Record<string, any>;
    content: InlineContent[];
    children: Block[];
};

export type InlineContent = {
    type: string;
    text: string;
    styles: Record<string, any>;
    href?: string;
};

export function serializeBlocksToMarkdown(blocks: Block[]): string {
    if (!blocks || !Array.isArray(blocks)) return '';
    return blocks.map(block => serializeBlock(block)).join('\n\n');
}

function serializeBlock(block: Block): string {
    const content = serializeInlineContent(block.content);
    const children = block.children ? serializeBlocksToMarkdown(block.children) : '';

    switch (block.type) {
        case 'heading':
            const level = block.props.level || 1;
            return `${'#'.repeat(level)} ${content}`;
        case 'paragraph':
            return content;
        case 'bulletListItem':
            return `- ${content}${children ? '\n' + indent(children) : ''}`;
        case 'numberedListItem':
            return `1. ${content}${children ? '\n' + indent(children) : ''}`;
        case 'checkListItem':
            return `- [${block.props.checked ? 'x' : ' '}] ${content}${children ? '\n' + indent(children) : ''}`;
        case 'image':
            return `![${block.props.caption || block.props.name || 'image'}](${block.props.url})`;
        case 'codeBlock':
            return `\`\`\`${block.props.language || ''}\n${content}\n\`\`\``;
        case 'quote':
            return `> ${content}`;
        default:
            return content;
    }
}

function indent(text: string): string {
    return text.split('\n').map(line => '  ' + line).join('\n');
}

function serializeInlineContent(content: InlineContent[]): string {
    if (!content) return '';

    return content.map(item => {
        let text = item.text;

        if (item.styles) {
            if (item.styles.bold) text = `**${text}**`;
            if (item.styles.italic) text = `*${text}*`;
            if (item.styles.strike) text = `~~${text}~~`;
            if (item.styles.code) text = `\`${text}\``;
        }

        if (item.type === 'link') {
            text = `[${text}](${item.href})`;
        }

        return text;
    }).join('');
}
