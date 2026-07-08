const PRINT_PAGINATION_STYLES = `<style data-smartquote-print-pagination>
@media print {
  html, body { max-width: 100% !important; overflow-x: hidden !important; }
  *, *::before, *::after { min-width: 0; overflow-wrap: anywhere; }
  [style*="white-space:nowrap"], [style*="white-space: nowrap"] { white-space: normal !important; }

  /* Sections flow and split freely across pages. They must NOT be forced
     atomic - doing so made a medium-height section jump whole to the next
     page and leave a large blank gap behind it. The explicit pdf-splittable
     hook documents the same intent for templates that opt in. */
  section, article, .section, .sec, .pdf-splittable {
    break-inside: auto !important; page-break-inside: auto !important;
  }

  /* A heading, eyebrow or section label must never be the last thing on a
     page: it stays with the content block that follows it. Real headings
     (h1-h6) plus the div-based section labels used by some templates and the
     explicit pdf-heading-group hook. */
  h1, h2, h3, h4, h5, h6,
  .sec-label, .sec-rule, .pdf-heading-group,
  [class*="eyebrow"], [class*="kicker"] {
    break-after: avoid-page !important;
    page-break-after: avoid !important;
  }

  /* Self-contained sub-blocks the layout script measured as fitting on one
     page (cards, tiles, rows, grid cells, signatures) never split across a
     page break. Blocks taller than the printable area keep break-inside:auto
     so they degrade by splitting instead of being clipped or vanishing. */
  .sq-keep-together {
    break-inside: avoid-page !important;
    page-break-inside: avoid !important;
  }

  .sq-manual-page-break {
    display: block !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    break-before: page !important;
    page-break-before: always !important;
  }

  /* Tables: header repeats on every page, rows never split mid-row. */
  table tr, .pdf-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
  thead, .pdf-table thead { display: table-header-group; }

  p, li { orphans: 3; widows: 3; }
}

/* Full-bleed page: a section/cover/footer that must reach every paper edge.
   Templates opt in with class="pdf-full-bleed" and set their own main @page
   margin; this named page guarantees the edge-to-edge area regardless. */
@page sq-full-bleed { size: A4; margin: 0; }
.pdf-full-bleed { page: sq-full-bleed; }
</style>
<script data-smartquote-print-pagination-script>
(function(){
  // Printable height budget in CSS px. A4 at 96dpi is ~1122.5px; we subtract a
  // conservative vertical margin so a block marked "keep together" still fits
  // on pages that carry a content margin (e.g. @page{margin:10mm 0}). Templates
  // can override via :root{--pdf-page-content-px:NNN}.
  var DEFAULT_CONTENT_PX = 1040;
  function pageBudget(){
    try {
      var raw = getComputedStyle(document.documentElement).getPropertyValue('--pdf-page-content-px');
      var parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    } catch (e) { /* ignore */ }
    return DEFAULT_CONTENT_PX;
  }
  function preparePagination(){
    var maxHeight = pageBudget();
    // Mark self-contained sub-blocks (cards, tiles, rows, grid cells, signature
    // blocks) as "keep together" only while they fit on a single page. Whole
    // sections stay splittable on purpose so they fill the page instead of
    // leaving a gap; oversized atomic blocks also stay splittable so they
    // degrade gracefully rather than being clipped.
    var nodes = document.querySelectorAll('.card,[class*="-card"],[class*="-tile"],.pkg-card,.prio-card,.avoid,.avoid-break,.print-keep,.pdf-keep,.pdf-signatures,.sig-wrap,.sig-row,.sig-cols,.signature,.summary,.totals,.tl-step,.extra-item,.pay-cell,.grid > *,[class*="grid"] > *');
    for(var i=0;i<nodes.length;i++){
      var node=nodes[i];
      node.classList.toggle('sq-keep-together', node.getBoundingClientRect().height <= maxHeight);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',preparePagination);
  else preparePagination();
  window.addEventListener('beforeprint',preparePagination);
})();
</script>`

const PDF_PREVIEW_STYLES = `<script data-smartquote-pdf-preview-script>
(function(){
  // Chrome prints CSS px 1:1 at scale 1, so an A4 page is 297mm = ~1122.5px tall.
  var A4_HEIGHT_PX = 297 * 96 / 25.4;
  var cachedGeometry = null;

  function parseLen(value) {
    var m = /^(-?\\d*\\.?\\d+)(mm|cm|in|pt|px)?$/.exec(String(value || '').trim());
    if (!m) return 0;
    var n = parseFloat(m[1]);
    switch (m[2]) {
      case 'mm': return n * 96 / 25.4;
      case 'cm': return n * 96 / 2.54;
      case 'in': return n * 96;
      case 'pt': return n * 96 / 72;
      default: return n;
    }
  }

  function readPageMargins(rules, out) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (rule.type === CSSRule.PAGE_RULE) {
        // Only the unnamed default @page describes regular content pages;
        // named pages (e.g. sq-full-bleed) opt specific sections out.
        if (rule.selectorText && rule.selectorText.trim()) continue;
        var st = rule.style;
        if (st.marginTop) out.top = parseLen(st.marginTop);
        if (st.marginBottom) out.bottom = parseLen(st.marginBottom);
        if (st.marginLeft) out.left = parseLen(st.marginLeft);
        if (st.marginRight) out.right = parseLen(st.marginRight);
      } else if (rule.cssRules && rule.cssRules.length) {
        readPageMargins(rule.cssRules, out);
      }
    }
  }

  // The PDF honours the template's @page margins, so each printed page holds
  // (A4 height - vertical margins) of content. The preview must paginate on
  // that same budget or it drifts further from the PDF with every page.
  function pageGeometry() {
    if (cachedGeometry) return cachedGeometry;
    var m = { top: 0, right: 0, bottom: 0, left: 0 };
    for (var s = 0; s < document.styleSheets.length; s++) {
      var rules;
      try { rules = document.styleSheets[s].cssRules; } catch (e) { continue; }
      if (rules) readPageMargins(rules, m);
    }
    var contentHeight = A4_HEIGHT_PX - m.top - m.bottom;
    if (!(contentHeight > 200)) {
      m = { top: 0, right: 0, bottom: 0, left: 0 };
      contentHeight = A4_HEIGHT_PX;
    }
    cachedGeometry = { top: m.top, right: m.right, bottom: m.bottom, left: m.left, contentHeight: contentHeight };
    return cachedGeometry;
  }

  function appendStyle(id, css) {
    var old = document.getElementById(id);
    if (old) old.remove();
    var style = document.createElement('style');
    style.id = id;
    style.setAttribute('data-smartquote-pdf-preview', '');
    style.media = 'screen';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function clonePrintRulesForScreen() {
    var css = '';
    for (var s = 0; s < document.styleSheets.length; s++) {
      var sheet = document.styleSheets[s];
      var rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (var r = 0; r < rules.length; r++) {
        var rule = rules[r];
        if (rule.type === CSSRule.MEDIA_RULE && /(^|,)\\s*print\\s*(,|$)/.test(rule.conditionText || rule.media.mediaText || '')) {
          for (var i = 0; i < rule.cssRules.length; i++) {
            if (rule.cssRules[i].type !== CSSRule.PAGE_RULE) css += rule.cssRules[i].cssText + '\\n';
          }
        }
      }
    }
    appendStyle('sq-print-css-screen-clone', css);
    appendStyle('sq-pdf-preview-screen-frame', [
      'html{background:#CDD2E2!important;min-height:100%!important;overflow:auto!important;}',
      'body{position:relative!important;width:794px!important;min-width:794px!important;max-width:794px!important;min-height:1123px!important;margin:24px auto!important;background:#fff!important;box-shadow:0 16px 40px rgba(15,23,42,.18)!important;overflow-x:hidden!important;}',
      '.sq-page-break-marker-layer{position:absolute!important;inset:0 0 auto 0!important;height:100%!important;min-height:100%!important;pointer-events:none!important;z-index:2147483647!important;}',
      '.sq-page-break-marker{position:absolute!important;left:0!important;right:0!important;height:0!important;border-top:2px dashed #0284C7!important;box-shadow:0 0 0 3px rgba(255,255,255,.72)!important;}',
      '.sq-page-break-marker::before{content:attr(data-label)!important;position:absolute!important;right:12px!important;top:-12px!important;border-radius:999px!important;background:#0F172A!important;color:#FFFFFF!important;border:1px solid rgba(255,255,255,.9)!important;padding:2px 8px!important;font:700 10px/1.4 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;letter-spacing:0!important;box-shadow:0 4px 12px rgba(15,23,42,.22)!important;}',
      '.sq-manual-page-break{display:block!important;height:0;margin:0!important;padding:0!important;overflow:hidden!important;}',
      'body::after{content:"";display:block;height:0;}'
    ].join('\\n'));

    // Reproduce the PDF's @page margins on screen: the printed content box is
    // inset by them on every page, so the preview body gets the same padding.
    var geo = pageGeometry();
    appendStyle('sq-pdf-preview-page-margins', 'body{box-sizing:border-box!important;padding:' + geo.top + 'px ' + geo.right + 'px ' + geo.bottom + 'px ' + geo.left + 'px!important;}');

    relayout();
  }

  function layoutManualPageBreaks() {
    var geo = pageGeometry();
    var pageHeight = geo.contentHeight;
    var breaks = document.querySelectorAll('.sq-manual-page-break');
    if (!breaks.length) return;

    // The print-rule clone carries "height:0 !important" onto the screen, so the
    // spacer must be set as an important inline style or the cascade zeroes it out.
    for (var r = 0; r < breaks.length; r++) {
      breaks[r].style.setProperty('height', '0px', 'important');
    }

    // Content coordinates start below the top page margin.
    var contentTop = document.body.getBoundingClientRect().top + geo.top;
    for (var i = 0; i < breaks.length; i++) {
      var node = breaks[i];
      var top = node.getBoundingClientRect().top - contentTop;
      var remainder = top % pageHeight;
      var spacer = (remainder <= 1 || pageHeight - remainder <= 1) ? 0 : pageHeight - remainder;
      node.style.setProperty('height', spacer + 'px', 'important');
    }
  }

  function renderPageBreakMarkers() {
    var geo = pageGeometry();
    var pageHeight = geo.contentHeight;
    var layer = document.querySelector('.sq-page-break-marker-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'sq-page-break-marker-layer';
      document.body.appendChild(layer);
    }

    var totalHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.getBoundingClientRect().height
    );
    var pages = Math.max(1, Math.ceil((totalHeight - geo.top) / pageHeight));
    layer.style.height = Math.max(totalHeight, pageHeight) + 'px';
    layer.innerHTML = '';

    for (var page = 1; page < pages; page++) {
      var marker = document.createElement('div');
      marker.className = 'sq-page-break-marker';
      marker.style.top = (geo.top + page * pageHeight) + 'px';
      marker.setAttribute('data-label', 'Koniec strony ' + page + ' / początek strony ' + (page + 1));
      layer.appendChild(marker);
    }
  }

  function relayout() {
    layoutManualPageBreaks();
    renderPageBreakMarkers();
  }

  var relayoutQueued = false;
  function scheduleRelayout() {
    if (relayoutQueued) return;
    relayoutQueued = true;
    requestAnimationFrame(function(){
      relayoutQueued = false;
      relayout();
    });
  }

  function watchLayoutShifts() {
    // Late image loads and font swaps reflow the document after the initial
    // pass; realign the manual breaks whenever the body height changes, or the
    // section after a break drifts below the page boundary.
    if (window.ResizeObserver) {
      new ResizeObserver(scheduleRelayout).observe(document.body);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleRelayout);
    }
    document.addEventListener('load', scheduleRelayout, true);
  }

  function init() {
    clonePrintRulesForScreen();
    watchLayoutShifts();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', scheduleRelayout);
  window.addEventListener('resize', scheduleRelayout);
})();
</script>`

export function applyPrintPagination(html: string): string {
    if (html.includes('data-smartquote-print-pagination')) return html
    return html.includes('</head>')
        ? html.replace('</head>', `${PRINT_PAGINATION_STYLES}</head>`)
        : `${PRINT_PAGINATION_STYLES}${html}`
}

export function applyPdfPreviewMode(html: string): string {
    const withPreview = html.includes('data-smartquote-pdf-preview-script')
        ? html
        : html.includes('</head>')
            ? html.replace('</head>', `${PDF_PREVIEW_STYLES}</head>`)
            : `${PDF_PREVIEW_STYLES}${html}`

    return applyPrintPagination(withPreview)
}
