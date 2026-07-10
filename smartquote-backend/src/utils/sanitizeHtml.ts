// src/utils/sanitizeHtml.ts
import sanitizeHtml from 'sanitize-html';

// Matches the exact TipTap config in the frontend's RichTextEditor
// (StarterKit + Underline + Link) — src/components/email/RichTextEditor.tsx.
// Anything outside this set (script, style, event handlers, iframe, svg, ...)
// is stripped rather than escaped, so offer description/terms stay renderable
// HTML while closing the stored-XSS path into dangerouslySetInnerHTML.
const ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'hr', 'a',
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
    a: ['href', 'target', 'rel'],
};

/** Sanitizes TipTap-authored rich text (offer description/terms) before persisting. */
export function sanitizeRichText<T extends string | null | undefined>(html: T): T {
    if (html == null) return html;
    return sanitizeHtml(html, {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: ALLOWED_ATTRIBUTES,
        allowedSchemes: ['http', 'https', 'mailto'],
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
        },
    }) as T;
}
