import { describe, expect, it } from 'vitest';
import { renderMarkdownToHtml } from './markdown';

describe('renderMarkdownToHtml', () => {
  it('converts markdown content into sanitized html', () => {
    const html = renderMarkdownToHtml('## Title\n- item one\n- item two');

    expect(html).toContain('<h2>Title</h2>');
    expect(html).toContain('<li>item one</li>');
    expect(html).toContain('<li>item two</li>');
  });

  it('removes potentially dangerous script tags', () => {
    const html = renderMarkdownToHtml('Safe text <script>alert(1)</script>');

    expect(html).not.toContain('<script>');
    expect(html).toContain('<p>Safe text alert(1)</p>');
  });

  it('returns an empty string for blank input', () => {
    expect(renderMarkdownToHtml('   ')).toBe('');
    expect(renderMarkdownToHtml('')).toBe('');
  });
});
