import sanitizeHtml from 'sanitize-html';

/**
 * Sanitise rich-text HTML produced by the admin editors before it is stored or
 * rendered with dangerouslySetInnerHTML. Keeps normal formatting, strips
 * scripts, event handlers, javascript: URLs, iframes, forms, etc.
 */
export function sanitizeRichText(html: unknown): string {
    return sanitizeHtml(String(html ?? ''), {
        allowedTags: [
            'p', 'br', 'hr', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
            'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'font',
        ],
        allowedAttributes: {
            a: ['href', 'title', 'target', 'rel'],
            img: ['src', 'alt', 'title', 'width', 'height'],
            font: ['color', 'size'],
            td: ['colspan', 'rowspan'],
            th: ['colspan', 'rowspan'],
            '*': ['style', 'class', 'align'],
        },
        allowedSchemes: ['http', 'https', 'mailto', 'tel'],
        allowedSchemesByTag: { img: ['http', 'https'] },
        allowProtocolRelative: false,
        allowedStyles: {
            '*': {
                color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i],
                'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i],
                'text-align': [/^(left|right|center|justify)$/],
                'font-weight': [/^(normal|bold|[1-9]00)$/],
                'font-style': [/^(normal|italic)$/],
                'text-decoration': [/^[a-z\s-]+$/],
                'font-size': [/^\d+(\.\d+)?(px|em|rem|%)$/],
            },
        },
        transformTags: {
            a: (tagName, attribs) => ({
                tagName,
                attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
            }),
        },
    });
}
