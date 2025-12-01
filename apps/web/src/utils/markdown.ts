import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize, { defaultSchema, type Schema } from 'rehype-sanitize';

type AttributeValue = Array<string | Record<string, unknown>>;

const extendedAttributes = {
  ...(defaultSchema.attributes ?? {}),
  a: [...((defaultSchema.attributes?.a as AttributeValue) ?? []), 'target', 'rel'],
  img: [...((defaultSchema.attributes?.img as AttributeValue) ?? []), 'loading', 'decoding'],
};

const allowList: Schema = {
  ...defaultSchema,
  attributes: extendedAttributes,
};

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize, allowList)
  .use(rehypeStringify);

export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return '';
  }

  return markdownProcessor.processSync(markdown).toString();
}
