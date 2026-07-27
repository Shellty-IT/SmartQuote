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
    var nodes = document.querySelectorAll('.card,[class*="-card"],[class*="-tile"],.pkg-card,.prio-card,.avoid,.avoid-break,.pdf-keep,.pdf-signatures,.sig-wrap,.sig-row,.sig-cols,.signature,.summary,.totals,.tl-step,.extra-item,.pay-cell,.grid > *,[class*="grid"] > *');
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
  var SHIM_CLASS = 'sq-page-push';
  var PUSH_ATTR = 'data-sq-page-push';
  // Chrome's real page-fragmentation pass is an internal stage with no DOM/CSSOM
  // exposure - what we read via getBoundingClientRect() is the continuous,
  // unpaginated layout. Text near a page boundary can rewrap by a few pixels
  // between that continuous pass and the real fragmented one (font hinting,
  // margin handling at the break), so a break-inside:avoid block measured as
  // fitting with only a hair of headroom can still be pushed by the real
  // printer. Treat anything within this margin of the edge as "does not fit"
  // too, so the preview leans toward the same blank-space-over-split bias the
  // printer has, instead of drawing content the PDF will actually move.
  var AVOID_FIT_SLACK_PX = 32;
  var cachedPageRules = null;

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

  // Collects every @page rule keyed by page name ('' = the default page).
  // Named pages are not decoration: an element whose computed 'page' names one
  // prints with that page's margins, AND the name change itself forces a page
  // break. Ignoring them (as this preview used to) puts the section after a
  // full-bleed cover on the wrong page and skews every page after it.
  function readPageRules(rules, out) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (rule.type === CSSRule.PAGE_RULE) {
        var name = String(rule.selectorText || '').trim();
        if (name.charAt(0) === ':') continue; // :first / :left / :right pseudo pages
        var slot = out[name];
        if (!slot) { slot = out[name] = { top: 0, right: 0, bottom: 0, left: 0 }; }
        var st = rule.style;
        if (st.marginTop) slot.top = parseLen(st.marginTop);
        if (st.marginBottom) slot.bottom = parseLen(st.marginBottom);
        if (st.marginLeft) slot.left = parseLen(st.marginLeft);
        if (st.marginRight) slot.right = parseLen(st.marginRight);
      } else if (rule.cssRules && rule.cssRules.length) {
        readPageRules(rule.cssRules, out);
      }
    }
  }

  function pageRules() {
    if (cachedPageRules) return cachedPageRules;
    var out = {};
    for (var s = 0; s < document.styleSheets.length; s++) {
      var rules;
      try { rules = document.styleSheets[s].cssRules; } catch (e) { continue; }
      if (rules) readPageRules(rules, out);
    }
    if (!out['']) out[''] = { top: 0, right: 0, bottom: 0, left: 0 };
    cachedPageRules = out;
    return out;
  }

  function marginsFor(name) {
    var all = pageRules();
    return (name && all[name]) || all[''];
  }

  // The PDF honours the template's @page margins, so each printed page holds
  // (A4 height - that page's vertical margins) of content.
  function pageHeight(name) {
    var m = marginsFor(name);
    var h = A4_HEIGHT_PX - m.top - m.bottom;
    return h > 200 ? h : A4_HEIGHT_PX;
  }

  function pageNameOf(el) {
    if (!el || el.nodeType !== 1) return '';
    var value;
    try { value = getComputedStyle(el).page; } catch (e) { return ''; }
    return (!value || value === 'auto') ? '' : value;
  }

  // The page a box actually prints on. 'page' is inherited, but it computes to
  // 'auto' on descendants, so the used name is the nearest non-auto ancestor -
  // comparing an element with its parent directly would report a bogus change
  // back to the default page on every child of a named section.
  function effectivePageName(el) {
    var node = el;
    while (node && node !== document.body) {
      var name = pageNameOf(node);
      if (name) return name;
      node = node.parentElement;
    }
    return '';
  }

  // Page name of the very first printed page: walk the first rendered child
  // chain, since the cover section usually sits inside a wrapper div.
  function firstPageName() {
    var el = document.body;
    while (el) {
      var name = pageNameOf(el);
      if (name) return name;
      var child = el.firstElementChild;
      var next = null;
      while (child) {
        if (!child.classList.contains(SHIM_CLASS) && child.getBoundingClientRect().height > 0) { next = child; break; }
        child = child.nextElementSibling;
      }
      el = next;
    }
    return '';
  }

  function pageGeometry() {
    var first = marginsFor(firstPageName());
    var def = marginsFor('');
    return { top: first.top, right: def.right, bottom: def.bottom, left: def.left };
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
      '.' + SHIM_CLASS + '{display:block!important;width:100%!important;flex:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;pointer-events:none!important;}',
      'body::after{content:"";display:block;height:0;}'
    ].join('\\n'));

    // Reproduce the PDF's @page margins on screen: the printed content box is
    // inset by them on every page, so the preview body gets the same padding.
    var geo = pageGeometry();
    appendStyle('sq-pdf-preview-page-margins', 'body{box-sizing:border-box!important;padding:' + geo.top + 'px ' + geo.right + 'px ' + geo.bottom + 'px ' + geo.left + 'px!important;}');

    relayout();
  }

  // ── Fragmentation model ─────────────────────────────────────────────────────
  // Chrome does not slice the document every N pixels when printing: it honours
  // forced breaks and refuses to split blocks marked break-inside:avoid, pushing
  // them whole onto the next page. Slicing uniformly (what this preview used to
  // do) therefore drifts from the PDF by a whole page as soon as one block is
  // pushed. We replay the same decisions here, reading them from the same CSS
  // the printer obeys - clonePrintRulesForScreen() has already put the @media
  // print declarations in force on screen, so getComputedStyle() reports the
  // real break-before / break-inside / break-after / page values.

  // How a box would have to be moved to start a later page.
  //   'flow' - a spacer sibling can be inserted before it
  //   'row'  - a flex/grid item: the printer moves its whole row, so the push
  //            is applied as a margin to every item sharing its top edge
  //   null   - not participating in block layout, never moved
  function containerKind(el) {
    var parent = el.parentElement;
    if (!parent) return null;
    var cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed') return null;
    if (cs.float !== 'none') return null;
    var d = cs.display;
    if (d === 'none' || d === 'contents' || d.indexOf('inline') === 0) return null;
    var ps = getComputedStyle(parent);
    var pd = ps.display;
    if (pd === 'block' || pd === 'flow-root' || pd === 'list-item') return 'flow';
    if (pd === 'grid' || pd === 'inline-grid') return 'row';
    if (pd === 'flex' || pd === 'inline-flex') {
      var dir = ps.flexDirection;
      return (dir === 'column' || dir === 'column-reverse') ? 'flow' : 'row';
    }
    // Table rows stack top-to-bottom like flow, but the printer's per-row
    // 'table tr { break-inside:avoid }' rule (see PRINT_PAGINATION_STYLES)
    // pushes a whole <tr> at a time - pricing/invoice tables use this a lot.
    if (pd === 'table-row-group' || pd === 'table-header-group' || pd === 'table-footer-group' || pd === 'table') return 'table-row';
    return null;
  }

  function isBlockInFlow(el) {
    return containerKind(el) !== null;
  }

  function isForcedBreakValue(v) {
    return v === 'page' || v === 'always' || v === 'left' || v === 'right' || v === 'recto' || v === 'verso';
  }

  function isAvoidValue(v) {
    return v === 'avoid' || v === 'avoid-page';
  }

  // Next block-in-flow element after el's subtree. Skips wrappers that cannot
  // carry a break (absolutely positioned layers, flex/grid children) - stopping
  // at one would silently drop the break that ends a named page region.
  function nextFlowElement(el) {
    var node = el;
    while (node && node !== document.body) {
      var sibling = node.nextElementSibling;
      while (sibling) {
        if (isBlockInFlow(sibling) && sibling.getBoundingClientRect().height > 0) return sibling;
        var inner = sibling.firstElementChild;
        while (inner) {
          if (isBlockInFlow(inner) && inner.getBoundingClientRect().height > 0) return inner;
          inner = inner.nextElementSibling;
        }
        sibling = sibling.nextElementSibling;
      }
      node = node.parentElement;
    }
    return null;
  }

  // Every element that starts a page in the PDF, or must not be split, in
  // document order.
  function collectAtoms() {
    var all = document.body.getElementsByTagName('*');
    var forced = [];
    var i, el;

    // A change of page name forces a break both into and out of the named
    // region - this is what makes a full-bleed cover own page 1 by itself.
    for (i = 0; i < all.length; i++) {
      el = all[i];
      if (el.classList.contains(SHIM_CLASS)) continue;
      var name = pageNameOf(el);
      if (name && name !== effectivePageName(el.parentElement)) {
        forced.push(el);
        var after = nextFlowElement(el);
        if (after) forced.push(after);
      }
    }

    var atoms = [];
    for (i = 0; i < all.length; i++) {
      el = all[i];
      if (el.classList.contains(SHIM_CLASS)) continue;
      if (!isBlockInFlow(el)) continue;
      var cs = getComputedStyle(el);
      var isForced = isForcedBreakValue(cs.breakBefore) || forced.indexOf(el) !== -1;
      var avoid = isAvoidValue(cs.breakInside);
      var glue = isAvoidValue(cs.breakAfter);
      if (isForced || avoid || glue) {
        atoms.push({ el: el, forced: isForced, avoid: avoid, glue: glue, name: effectivePageName(el) });
      }
    }
    return atoms;
  }

  function gluedToNext(el) {
    if (!el || !isBlockInFlow(el)) return false;
    return isAvoidValue(getComputedStyle(el).breakAfter);
  }

  function insertShim(el, height) {
    // A <tr> may only have <tr>/<script>/<template> siblings inside its
    // row group - a bare <div> would be relocated out of the table by the
    // parser/DOM and measure nothing.
    var isRow = el.tagName === 'TR';
    var shim = document.createElement(isRow ? 'tr' : 'div');
    shim.className = SHIM_CLASS;
    shim.setAttribute('aria-hidden', 'true');
    if (isRow) {
      var td = document.createElement('td');
      td.style.setProperty('padding', '0', 'important');
      td.style.setProperty('border', '0', 'important');
      td.style.setProperty('height', height + 'px', 'important');
      shim.appendChild(td);
    } else {
      shim.style.setProperty('height', height + 'px', 'important');
    }
    el.parentNode.insertBefore(shim, el);
    return shim;
  }

  // Moves a flex/grid item down by growing the margin of every item on its row,
  // which is how the printer moves the row as a unit.
  function pushRow(el, amount) {
    var kids = el.parentElement.children;
    var rowTop = el.getBoundingClientRect().top;
    var row = [];
    for (var i = 0; i < kids.length; i++) {
      var kid = kids[i];
      if (kid.classList.contains(SHIM_CLASS)) continue;
      var r = kid.getBoundingClientRect();
      if (r.height > 0 && Math.abs(r.top - rowTop) <= 2) row.push(kid);
    }
    if (!row.length) row.push(el);
    for (var k = 0; k < row.length; k++) {
      var node = row[k];
      if (!node.hasAttribute(PUSH_ATTR)) node.setAttribute(PUSH_ATTR, node.style.marginTop || '');
      var current = parseFloat(getComputedStyle(node).marginTop) || 0;
      node.style.setProperty('margin-top', (current + amount) + 'px', 'important');
    }
  }

  function setShimHeight(shim, height) {
    var target = shim.tagName === 'TR' ? shim.firstElementChild : shim;
    if (target) target.style.setProperty('height', height + 'px', 'important');
  }

  function movePast(el, kind, amount) {
    if (kind === 'row') { pushRow(el, amount); return null; }
    return insertShim(el, amount);
  }

  // Replays Chrome's pagination and returns the document-space offsets at which
  // each printed page ends. Blocks the printer would push are pushed here too,
  // by inserting a spacer, so the preview shows the same gaps as the PDF.
  function paginate() {
    var shims = document.querySelectorAll('.' + SHIM_CLASS);
    for (var s = shims.length - 1; s >= 0; s--) shims[s].parentNode.removeChild(shims[s]);
    var pushed = document.querySelectorAll('[' + PUSH_ATTR + ']');
    for (var q = 0; q < pushed.length; q++) {
      pushed[q].style.marginTop = pushed[q].getAttribute(PUSH_ATTR) || '';
      pushed[q].removeAttribute(PUSH_ATTR);
    }

    var geo = pageGeometry();
    var contentTop = document.body.getBoundingClientRect().top + geo.top;
    var atoms = collectAtoms();
    var boundaries = [];
    var pageTop = 0;
    var currentName = '';
    var limit = pageHeight(currentName);
    var skipUntil = null;

    for (var i = 0; i < atoms.length; i++) {
      var atom = atoms[i];
      var el = atom.el;

      // Nothing inside an unbreakable block can be paginated on its own.
      if (skipUntil) {
        if (skipUntil.contains(el)) continue;
        skipUntil = null;
      }

      var rect = el.getBoundingClientRect();
      var top = rect.top - contentTop;
      var height = rect.height;

      // Pages crossed by plain flow content since the previous atom. They
      // belong to the region this atom sits in - a region change would have
      // produced a forced atom of its own.
      while (top >= limit - 0.5) {
        boundaries.push(limit);
        pageTop = limit;
        limit = pageTop + pageHeight(atom.name);
      }
      currentName = atom.name;

      var atTop = top <= pageTop + 0.5;
      var push = 0;

      if (atom.forced) {
        if (!atTop) push = limit - top;
      } else if (atom.avoid && height > 0.5 && height <= pageHeight(atom.name) + 0.5 && top + height > limit - AVOID_FIT_SLACK_PX + 0.5) {
        push = limit - top;
      } else if (atom.glue && top + height <= limit + 0.5) {
        // break-after:avoid: this box must not be the last thing on a page.
        // If the very next flow content already lands beyond the current
        // page, an unforced boundary would fall right after it - push it
        // along so it opens the next page together with what follows.
        var nxt = nextFlowElement(el);
        if (nxt) {
          var nxtTop = nxt.getBoundingClientRect().top - contentTop;
          if (nxtTop >= limit - 0.5) push = limit - top;
        }
      }

      if (push > 0.5) {
        // A heading with break-after:avoid travels with the block it introduces.
        var target = el;
        var kind = containerKind(el);
        if (kind === 'flow') {
          var prev = el.previousElementSibling;
          while (prev && !prev.classList.contains(SHIM_CLASS) && gluedToNext(prev)) {
            target = prev;
            prev = prev.previousElementSibling;
          }
        }
        var targetTop = target === el ? top : target.getBoundingClientRect().top - contentTop;
        var shim = movePast(target, kind, limit - targetTop);
        // Inserting the spacer stops the target's top margin from collapsing,
        // so correct once against the position it actually landed at.
        var drift = limit - (target.getBoundingClientRect().top - contentTop);
        if (shim && (drift > 0.5 || drift < -0.5)) {
          setShimHeight(shim, Math.max(0, (limit - targetTop) + drift));
        }
        boundaries.push(limit);
        pageTop = limit;
        currentName = atom.name;
        limit = pageTop + pageHeight(currentName);
      } else if (atom.forced && atTop) {
        // The page this atom opens takes the atom's page geometry.
        currentName = atom.name;
        limit = pageTop + pageHeight(currentName);
      }

      // Pages the atom itself spans stay in the atom's region - a full-bleed
      // cover taller than one sheet keeps full-bleed geometry on its second page.
      var end = el.getBoundingClientRect().top - contentTop + height;
      var spanGuard = 0;
      while (end > limit + 0.5 && spanGuard++ < 400) {
        boundaries.push(limit);
        pageTop = limit;
        limit = pageTop + pageHeight(atom.name);
      }

      if (atom.avoid) skipUntil = el;
    }

    // Content past the last atom still spans pages.
    var docEnd = document.body.scrollHeight - geo.top - geo.bottom;
    var guard = 0;
    while (limit < docEnd - 0.5 && guard++ < 400) {
      boundaries.push(limit);
      pageTop = limit;
      limit = pageTop + pageHeight(currentName);
    }

    return boundaries;
  }

  function renderPageBreakMarkers(boundaries) {
    var geo = pageGeometry();
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
    layer.style.height = totalHeight + 'px';
    layer.innerHTML = '';

    for (var i = 0; i < boundaries.length; i++) {
      var marker = document.createElement('div');
      marker.className = 'sq-page-break-marker';
      marker.style.top = (geo.top + boundaries[i]) + 'px';
      marker.setAttribute('data-label', 'Koniec strony ' + (i + 1) + ' / początek strony ' + (i + 2));
      layer.appendChild(marker);
    }
  }

  var applying = false;
  function relayout() {
    if (applying) return;
    applying = true;
    try {
      // Templates and the shared pagination script decide which blocks are
      // "keep together" by measuring them, and they re-measure on beforeprint.
      // They first ran against the raw iframe width; re-fire now that the body
      // is laid out at the printed 794px, so the flags match what the PDF gets.
      window.dispatchEvent(new Event('beforeprint'));
      renderPageBreakMarkers(paginate());
    } finally {
      applying = false;
    }
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
