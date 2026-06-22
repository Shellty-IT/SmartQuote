export type DocumentAction = 'accept' | 'sign'

const ACTION_PATTERNS: Record<DocumentAction, RegExp> = {
    accept: /\b(?:za)?akceptuj(?:ę|e|esz|emy|ecie|ą)?\b/i,
    sign: /\bpodpisz(?:ę|esz|emy|ecie|ą)?\b|\b(?:za)?akceptuj(?:ę|e|esz|emy|ecie|ą)?\s+umow/i,
}

export function isDocumentActionLabel(label: string, action: DocumentAction): boolean {
    return ACTION_PATTERNS[action].test(label.trim())
}

export function publicDocumentUrl(kind: 'offer' | 'contract', token: unknown, action: DocumentAction): string | null {
    if (typeof token !== 'string' || !token) return null
    const configuredUrl = process.env.NEXT_PUBLIC_FRONTEND_URL ?? process.env.NEXTAUTH_URL
        ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    const frontendUrl = configuredUrl.replace(/\/$/, '')
    if (!frontendUrl) return null
    return `${frontendUrl}/${kind}/view/${encodeURIComponent(token)}#${action}`
}

function escapeForInlineScript(value: string): string {
    return JSON.stringify(value).replace(/</g, '\\u003c')
}

/** Adds real anchors to document CTA elements, so they work in HTML and remain clickable in PDFs. */
export function addDocumentActionLinks(
    html: string,
    actionUrl: string | null | undefined,
    action: DocumentAction,
): string {
    if (!actionUrl) return html

    const pattern = ACTION_PATTERNS[action]
    const script = `<script>(function(){
var url=${escapeForInlineScript(actionUrl)};
var action=${escapeForInlineScript(action)};
var pattern=new RegExp(${escapeForInlineScript(pattern.source)},${escapeForInlineScript(pattern.flags)});
var nodes=document.querySelectorAll('[data-sq-action="'+action+'"],a,button,[class*="btn"],[class*="cta"]');
for(var i=0;i<nodes.length;i++){
  var el=nodes[i];
  var explicit=el.getAttribute('data-sq-action')===action;
  if(!explicit&&!pattern.test((el.textContent||'').trim())) continue;
  if(el.tagName==='A'){
    el.setAttribute('href',url);el.setAttribute('target','_top');
  }else{
    var link=document.createElement('a');
    link.href=url;link.target='_top';link.style.color='inherit';link.style.textDecoration='none';
    link.style.display=getComputedStyle(el).display==='block'?'block':'inline-block';
    el.parentNode.insertBefore(link,el);link.appendChild(el);
  }
}
})();</script>`

    return html.includes('</body>') ? html.replace('</body>', `${script}</body>`) : `${html}${script}`
}
