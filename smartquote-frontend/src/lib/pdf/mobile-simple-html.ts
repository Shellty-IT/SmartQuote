// src/lib/pdf/mobile-simple-html.ts
// HTML generator for the "Aplikacja mobilna - domyślny" offer template.
// Design: teal #0D9488 + orange #F97316, Outfit font, clean B2C-friendly layout.

import { buildHtmlDocument } from './html-shell'
import { resolveHeadlinePrice } from './money'
import {
    type MobileSimpleBlocks,
    type MobileSimpleSectionKey,
} from './mobile-simple-blocks'

export interface MobileSimpleOfferData {
    offerNumber?: string
    offerDate?: string
    validUntil?: string
    clientName?: string
    userLogoUrl?: string
    userLogoDarkUrl?: string
    userCompanyName?: string
    userEmail?: string
    userPhone?: string
    userWebsite?: string
    totalNet?: number
    totalGross?: number
    currency?: string
}

function esc(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// ── Editor wrap helper ────────────────────────────────────────────────────────

function editorWrap(editorMode: boolean, key: string, inner: string): string {
    if (!editorMode) return inner
    return `<div class="sq-block" data-key="${key}" onclick="event.stopPropagation();window.parent.postMessage({type:'sq:editBlock',blockKey:'${key}'},'*')" style="cursor:pointer;outline:2px solid transparent;border-radius:4px;" onmouseover="this.style.outline='2px solid #0D9488'" onmouseout="this.style.outline='2px solid transparent'">${inner}</div>`
}

// ── Cover ─────────────────────────────────────────────────────────────────────

function renderCover(
    b: MobileSimpleBlocks['cover'],
    pricing: MobileSimpleBlocks['process'],
    offer: MobileSimpleOfferData,
    editorMode: boolean,
): string {
    // Keep the cover price pill in sync with the actual offer total / override.
    const coverPrice = resolveHeadlinePrice({
        priceOverride: pricing.priceOverride,
        priceType: pricing.priceType,
        totalNet: offer.totalNet,
        totalGross: offer.totalGross,
    })
    const coverPriceText = coverPrice.amount !== null
        ? coverPrice.amount.toLocaleString('pl-PL')
        : b.priceText
    const coverPriceLabel = coverPrice.amount !== null ? `Cena ${coverPrice.label}` : b.priceLabel

    const promises = b.promises.map(p => `
        <div class="promise-item">
            <span class="promise-check">✓</span>
            <span>${p}</span>
        </div>
    `).join('')

    const coverHtml = `
<section class="cover pdf-full-bleed">
    <div class="cover-inner">
        <div class="cover-left">
            <div class="cover-tag">${esc(b.coverTag)}</div>
            <h1 class="cover-title">${esc(b.projectName)}</h1>
            <p class="cover-subtitle">${esc(b.subtitlePrefix)} <strong>${esc(b.clientName || offer.clientName || 'Twojej firmy')}</strong></p>
            <div class="cover-meta">
                ${offer.offerNumber ? `<span class="meta-pill">Nr: ${offer.offerNumber}</span>` : ''}
                ${offer.offerDate ? `<span class="meta-pill">Data: ${offer.offerDate}</span>` : ''}
            </div>
            <div class="cover-highlights">
                <div class="highlight-card">
                    <div class="highlight-value">${esc(b.readyWeeks)} tyg.</div>
                    <div class="highlight-label">${esc(b.deliveryLabel)}</div>
                </div>
                <div class="highlight-card">
                    <div class="highlight-value">${esc(coverPriceText)} zł</div>
                    <div class="highlight-label">${esc(coverPriceLabel)}</div>
                </div>
                <div class="highlight-card">
                    <div class="highlight-value">${esc(b.platformCount)}</div>
                    <div class="highlight-label">${esc(b.platformLabel)}</div>
                </div>
            </div>
        </div>
        <div class="cover-right">
            <div class="phone-mockup">
                <div class="phone-frame">
                    <div class="phone-notch"></div>
                    <div class="phone-screen">
                        <div class="app-nav">${esc(b.projectName)}</div>
                        <div class="app-content">
                            <div class="app-tile app-tile-large"></div>
                            <div class="app-tiles-row">
                                <div class="app-tile app-tile-sm"></div>
                                <div class="app-tile app-tile-sm"></div>
                            </div>
                            <div class="app-tiles-row">
                                <div class="app-tile app-tile-sm app-tile-accent"></div>
                                <div class="app-tile app-tile-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="phone-glow"></div>
            </div>
        </div>
    </div>
    <div class="cover-promises">
        ${promises}
    </div>
</section>`
    return editorWrap(editorMode, 'cover', coverHtml)
}

// ── Checklist ─────────────────────────────────────────────────────────────────

function renderChecklist(
    b: MobileSimpleBlocks['checklist'],
    editorMode: boolean,
): string {
    const items = b.items.map(item => `
        <div class="check-item">
            <span class="check-icon">✓</span>
            <div>
                <div class="check-title">${item.title}</div>
                <div class="check-desc">${item.description}</div>
            </div>
        </div>
    `).join('')

    const options = b.options.map(opt => `
        <div class="option-card">
            <span class="option-emoji">${opt.emoji}</span>
            <div class="option-label">${opt.label}</div>
            <div class="option-price">+${opt.price} zł</div>
        </div>
    `).join('')

    const inner = `
<section class="section">
    <div class="section-header">
        <h2 class="section-title">${b.sectionTitle}</h2>
        <p class="section-lead">${b.sectionLead}</p>
    </div>
    <div class="check-grid">
        ${items}
    </div>
    ${b.infoBoxText ? `<div class="info-box">${b.infoBoxText}</div>` : ''}
    <div class="options-block">
        <h3 class="options-title">${b.optionsTitle}</h3>
        <p class="options-lead">${b.optionsLead}</p>
        <div class="options-grid">
            ${options}
        </div>
    </div>
</section>`
    return editorWrap(editorMode, 'checklist', inner)
}

// ── Tech ──────────────────────────────────────────────────────────────────────

function renderTechCard(card: MobileSimpleBlocks['tech']['cardA'], isAccent: boolean): string {
    const pros = card.pros.map(p => `<li>${p}</li>`).join('')
    const badgeClass = card.badgeVariant === 'accent' ? 'badge-accent' : 'badge-primary'
    return `
<div class="tech-card ${isAccent ? 'tech-card-accent' : ''}">
    <div class="tech-card-top">
        <span class="tech-icon">${card.icon}</span>
        <span class="tech-badge ${badgeClass}">${card.badge}</span>
    </div>
    <h3 class="tech-card-title">${card.title}</h3>
    <p class="tech-tagline">${card.tagline}</p>
    <p class="tech-desc">${card.description}</p>
    <ul class="tech-pros">
        ${pros}
    </ul>
</div>`
}

function renderTech(
    b: MobileSimpleBlocks['tech'],
    editorMode: boolean,
): string {
    const inner = `
<section class="section section-alt">
    <div class="section-header">
        <h2 class="section-title">${b.sectionTitle}</h2>
        <p class="section-lead">${b.sectionLead}</p>
    </div>
    <div class="tech-grid">
        ${renderTechCard(b.cardA, false)}
        ${renderTechCard(b.cardB, true)}
    </div>
    <div class="tech-alternative">
        <div class="alt-dashed">
            <span class="alt-emoji">💬</span>
            <p>${b.alternativeText}</p>
        </div>
    </div>
</section>`
    return editorWrap(editorMode, 'tech', inner)
}

// ── Process + Pricing ─────────────────────────────────────────────────────────

function renderProcess(
    b: MobileSimpleBlocks['process'],
    offer: MobileSimpleOfferData,
    editorMode: boolean,
): string {
    const steps = b.steps.map((step, i) => `
        <div class="step">
            <div class="step-circle">${i + 1}</div>
            <div class="step-body">
                <div class="step-title">${step.title}</div>
                <div class="step-desc">${step.description}</div>
            </div>
        </div>
    `).join('')

    const includes = b.priceIncludes.map(item => `<li>${item}</li>`).join('')

    const guarantees = b.guarantees.map(g => `
        <div class="guarantee-card">
            <span class="guarantee-emoji">${g.emoji}</span>
            <span class="guarantee-label">${g.label}</span>
        </div>
    `).join('')

    // Headline = manual override or the offer's computed total for the chosen
    // net/gross type; falls back to the legacy free-text priceNet when neither
    // is available.
    const resolvedPrice = resolveHeadlinePrice({
        priceOverride: b.priceOverride,
        priceType: b.priceType,
        totalNet: offer.totalNet,
        totalGross: offer.totalGross,
    })
    const displayPrice = resolvedPrice.amount !== null
        ? resolvedPrice.amount.toLocaleString('pl-PL')
        : b.priceNet

    const inner = `
<section class="section process-section">
    <div class="process-layout">
        <div class="process-left">
            <h2 class="section-title">${b.processTitle}</h2>
            <div class="steps">
                ${steps}
            </div>
            ${b.timelineNote ? `<p class="timeline-note">${b.timelineNote}</p>` : ''}
        </div>
        <div class="process-right">
            <div class="price-card">
                <div class="price-card-header">Twoja inwestycja</div>
                <div class="price-big">${displayPrice} <span class="price-currency">zł</span></div>
                <div class="price-suffix">${resolvedPrice.label}</div>
                <ul class="price-includes">
                    ${includes}
                </ul>
                <div class="payment-schedule">
                    <div class="payment-label">Harmonogram płatności</div>
                    <div class="payment-row">
                        <span class="payment-percent">${b.payment1Percent}%</span>
                        <span class="payment-desc">Na start</span>
                        <span class="payment-amount">${b.payment1Amount} zł</span>
                    </div>
                    <div class="payment-divider"></div>
                    <div class="payment-row">
                        <span class="payment-percent">${b.payment2Percent}%</span>
                        <span class="payment-desc">Po wdrożeniu</span>
                        <span class="payment-amount">${b.payment2Amount} zł</span>
                    </div>
                </div>
                ${b.validUntil ? `<div class="price-validity">Oferta ważna do: <strong>${b.validUntil}</strong></div>` : ''}
                <div class="price-cta">Porozmawiajmy!</div>
            </div>
        </div>
    </div>
    <div class="guarantees-row">
        ${guarantees}
    </div>
</section>`
    return editorWrap(editorMode, 'process', inner)
}

// ── Footer ────────────────────────────────────────────────────────────────────

function renderFooter(
    b: MobileSimpleBlocks['footer'],
    offer: MobileSimpleOfferData,
    editorMode: boolean,
): string {
    const companyName = offer.userCompanyName || ''
    const inner = `
<footer class="footer pdf-full-bleed">
    <div class="footer-inner">
        <div class="footer-left">
            ${offer.userLogoDarkUrl || offer.userLogoUrl ? `<img src="${offer.userLogoDarkUrl || offer.userLogoUrl}" class="footer-logo" alt="Logo" />` : ''}
            ${companyName ? `<div class="footer-company">${companyName}</div>` : ''}
            <p class="footer-tagline">${b.tagline}</p>
            <div class="footer-links">
                ${b.websiteUrl ? `<a href="${b.websiteUrl}" class="footer-link">${b.websiteUrl}</a>` : ''}
                ${b.linkedinUrl && b.linkedinUrl !== '#' ? `<a href="${b.linkedinUrl}" class="footer-link">LinkedIn</a>` : ''}
                ${b.githubUrl && b.githubUrl !== '#' ? `<a href="${b.githubUrl}" class="footer-link">GitHub</a>` : ''}
            </div>
        </div>
        <div class="footer-right">
            <div class="footer-contact-title">Kontakt</div>
            ${b.contactEmail ? `<a href="mailto:${b.contactEmail}" class="footer-contact">${b.contactEmail}</a>` : ''}
            ${b.contactPhone ? `<a href="tel:${b.contactPhone.replace(/\s/g, '')}" class="footer-contact">${b.contactPhone}</a>` : ''}
            ${offer.userEmail ? `<a href="mailto:${offer.userEmail}" class="footer-contact">${offer.userEmail}</a>` : ''}
            ${offer.userPhone ? `<a href="tel:${offer.userPhone.replace(/\s/g, '')}" class="footer-contact">${offer.userPhone}</a>` : ''}
        </div>
    </div>
    <div class="footer-bar">
        <span>${companyName || 'SmartQuote'} • Oferta wygenerowana w SmartQuote</span>
    </div>
</footer>`
    return editorWrap(editorMode, 'footer', inner)
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(
    key: MobileSimpleSectionKey,
    blocks: MobileSimpleBlocks,
    offer: MobileSimpleOfferData,
    editorMode: boolean,
): string {
    switch (key) {
        case 'checklist': return renderChecklist(blocks.checklist, editorMode)
        case 'tech': return renderTech(blocks.tech, editorMode)
        case 'process': return renderProcess(blocks.process, offer, editorMode)
    }
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --primary: #0D9488;
    --primary-dark: #065F5B;
    --primary-light: #F0FDFA;
    --accent: #F97316;
    --accent-dark: #EA580C;
    --text: #0F172A;
    --text-muted: #64748B;
    --bg: #FFFFFF;
    --bg-alt: #F8FAFC;
    --border: #E2E8F0;
    --white: #FFFFFF;
}

body {
    font-family: 'Outfit Variable', 'Outfit', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    font-size: 15px;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

/* ── Cover ──────────────────────────────────────────────────────────────── */
.cover {
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 60%, #14B8A6 100%);
    color: var(--white);
    padding: 0;
    min-height: 380px;
    display: flex;
    flex-direction: column;
}

.cover-inner {
    display: flex;
    align-items: center;
    gap: 40px;
    padding: 48px 56px 32px;
    flex: 1;
}

.cover-left { flex: 1; }

.cover-tag {
    display: inline-block;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 20px;
    padding: 4px 16px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 16px;
}

.cover-title {
    font-size: 42px;
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 10px;
}

.cover-subtitle {
    font-size: 17px;
    opacity: 0.9;
    margin-bottom: 20px;
}

.cover-meta {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
    flex-wrap: wrap;
}

.meta-pill {
    background: rgba(255,255,255,0.15);
    border-radius: 20px;
    padding: 4px 14px;
    font-size: 12px;
    font-weight: 500;
}

.cover-highlights {
    display: flex;
    gap: 16px;
}

.highlight-card {
    background: rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 12px 20px;
    text-align: center;
    min-width: 80px;
}

.highlight-value {
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
}

.highlight-label {
    font-size: 10px;
    opacity: 0.8;
    margin-top: 4px;
    font-weight: 500;
}

/* Phone mockup */
.cover-right {
    flex-shrink: 0;
    position: relative;
}

.phone-mockup {
    position: relative;
    display: inline-block;
}

.phone-frame {
    width: 140px;
    height: 260px;
    background: #0F172A;
    border-radius: 28px;
    border: 3px solid rgba(255,255,255,0.3);
    overflow: hidden;
    position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}

.phone-notch {
    width: 50px;
    height: 14px;
    background: #0F172A;
    border-radius: 0 0 12px 12px;
    margin: 0 auto;
    z-index: 2;
    position: relative;
}

.phone-screen {
    background: var(--primary-light);
    height: calc(100% - 14px);
    display: flex;
    flex-direction: column;
}

.app-nav {
    background: var(--primary);
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 6px 10px;
    text-align: center;
}

.app-content {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
}

.app-tile {
    background: var(--primary);
    border-radius: 8px;
    opacity: 0.7;
}

.app-tile-large { height: 60px; }
.app-tiles-row { display: flex; gap: 6px; }
.app-tile-sm { flex: 1; height: 36px; }
.app-tile-accent { background: var(--accent); opacity: 0.8; }

.phone-glow {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 30px;
    background: rgba(20,184,166,0.4);
    filter: blur(16px);
    border-radius: 50%;
}

/* Promise strip */
.cover-promises {
    background: rgba(0,0,0,0.2);
    padding: 14px 56px;
    display: flex;
    gap: 32px;
    align-items: center;
    flex-wrap: wrap;
}

.promise-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    opacity: 0.95;
}

.promise-check {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
}

/* ── Sections ────────────────────────────────────────────────────────────── */
.section {
    padding: 52px 56px;
}

.section-alt {
    background: var(--bg-alt);
}

.section-header {
    max-width: 640px;
    margin-bottom: 36px;
}

.section-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 10px;
    line-height: 1.2;
}

.section-lead {
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.6;
}

/* ── Checklist ───────────────────────────────────────────────────────────── */
.check-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 28px;
}

.check-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--white);
}

.check-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
}

.check-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 2px;
}

.check-desc {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
}

.info-box {
    background: var(--primary-light);
    border-left: 4px solid var(--primary);
    border-radius: 0 10px 10px 0;
    padding: 16px 20px;
    font-size: 13px;
    color: var(--primary-dark);
    margin-bottom: 36px;
    font-weight: 500;
}

.options-block { margin-top: 8px; }

.options-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 6px;
}

.options-lead {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 20px;
}

.options-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
}

.option-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px 14px;
    text-align: center;
    background: var(--white);
    transition: border-color 0.2s;
}

.option-emoji {
    font-size: 28px;
    display: block;
    margin-bottom: 8px;
}

.option-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 8px;
    line-height: 1.3;
}

.option-price {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent);
}

/* ── Tech ────────────────────────────────────────────────────────────────── */
.tech-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.tech-card {
    background: var(--white);
    border: 2px solid var(--border);
    border-radius: 16px;
    padding: 24px;
}

.tech-card-accent {
    border-color: var(--accent);
}

.tech-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.tech-icon {
    font-size: 32px;
}

.tech-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 4px 10px;
    border-radius: 20px;
}

.badge-primary {
    background: var(--primary-light);
    color: var(--primary-dark);
}

.badge-accent {
    background: #FFF7ED;
    color: var(--accent-dark);
}

.tech-card-title {
    font-size: 22px;
    font-weight: 800;
    margin-bottom: 4px;
}

.tech-tagline {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 12px;
}

.tech-card-accent .tech-tagline {
    color: var(--accent);
}

.tech-desc {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 16px;
}

.tech-pros {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.tech-pros li {
    font-size: 13px;
    font-weight: 500;
    padding-left: 20px;
    position: relative;
}

.tech-pros li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--primary);
    font-weight: 700;
    font-size: 12px;
}

.tech-card-accent .tech-pros li::before {
    color: var(--accent);
}

.tech-alternative {
    margin-top: 4px;
}

.alt-dashed {
    border: 2px dashed var(--border);
    border-radius: 12px;
    padding: 18px 24px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: var(--white);
}

.alt-emoji {
    font-size: 24px;
    flex-shrink: 0;
}

.alt-dashed p {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
    margin: 0;
}

/* ── Process + Pricing ───────────────────────────────────────────────────── */
.process-section {
    padding-bottom: 40px;
}

.process-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 48px;
    align-items: start;
    margin-bottom: 36px;
}

.steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    margin-bottom: 20px;
}

.step {
    display: flex;
    gap: 16px;
    position: relative;
    padding-bottom: 24px;
}

.step:last-child { padding-bottom: 0; }

.step:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 34px;
    bottom: 0;
    width: 2px;
    background: var(--primary-light);
    border-left: 2px dashed var(--primary);
    opacity: 0.4;
}

.step-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    font-size: 14px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
}

.step-body { flex: 1; }

.step-title {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 4px;
}

.step-desc {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.5;
}

.timeline-note {
    font-size: 13px;
    color: var(--text-muted);
    font-style: italic;
    margin-top: 8px;
}

/* Price card */
.price-card {
    background: linear-gradient(160deg, var(--primary-dark) 0%, var(--primary) 100%);
    color: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(13,148,136,0.25);
}

.price-card-header {
    background: rgba(0,0,0,0.15);
    padding: 14px 24px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.price-big {
    padding: 20px 24px 4px;
    font-size: 44px;
    font-weight: 800;
    line-height: 1;
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.price-currency {
    font-size: 22px;
    font-weight: 700;
    opacity: 0.8;
}

.price-suffix {
    padding: 0 24px 20px;
    font-size: 12px;
    opacity: 0.7;
    font-weight: 500;
}

.price-includes {
    padding: 0 24px 16px;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-bottom: 1px solid rgba(255,255,255,0.15);
    margin-bottom: 16px;
}

.price-includes li {
    font-size: 12px;
    font-weight: 500;
    opacity: 0.9;
    padding-left: 18px;
    position: relative;
}

.price-includes li::before {
    content: '✓';
    position: absolute;
    left: 0;
    font-size: 10px;
    opacity: 0.7;
}

.payment-schedule {
    padding: 0 24px 16px;
}

.payment-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 10px;
}

.payment-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
}

.payment-percent {
    font-size: 18px;
    font-weight: 800;
}

.payment-desc {
    font-size: 12px;
    flex: 1;
    opacity: 0.8;
}

.payment-amount {
    font-size: 14px;
    font-weight: 700;
}

.payment-divider {
    height: 1px;
    background: rgba(255,255,255,0.1);
    margin: 2px 0;
}

.price-validity {
    padding: 0 24px 12px;
    font-size: 11px;
    opacity: 0.7;
}

.price-cta {
    margin: 0 24px 24px;
    background: var(--accent);
    color: white;
    text-align: center;
    padding: 12px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
}

/* Guarantees */
.guarantees-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.guarantee-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
}

.guarantee-emoji {
    font-size: 24px;
    flex-shrink: 0;
}

.guarantee-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    line-height: 1.3;
}

/* ── Footer ──────────────────────────────────────────────────────────────── */
.footer {
    background: #0F172A;
    color: white;
}

.footer-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    padding: 40px 56px;
}

.footer-logo {
    max-height: 36px;
    max-width: 140px;
    object-fit: contain;
    margin-bottom: 12px;
    display: block;
}

.footer-company {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
}

.footer-tagline {
    font-size: 13px;
    opacity: 0.6;
    line-height: 1.6;
    margin-bottom: 16px;
    max-width: 320px;
}

.footer-links {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

.footer-link {
    font-size: 12px;
    color: var(--primary);
    text-decoration: none;
    font-weight: 500;
}

.footer-contact-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.5;
    margin-bottom: 14px;
}

.footer-contact {
    display: block;
    font-size: 14px;
    color: rgba(255,255,255,0.8);
    text-decoration: none;
    margin-bottom: 8px;
    font-weight: 500;
}

.footer-bar {
    padding: 12px 56px;
    background: rgba(0,0,0,0.3);
    font-size: 11px;
    opacity: 0.5;
    text-align: center;
}

/* Print */
@media print {
    @page { size: A4; margin: 10mm 0; }
    .cover { min-height: 100vh; }
    .section { break-inside: auto; page-break-inside: auto; }
}
`

// ── Main export ───────────────────────────────────────────────────────────────

export function buildMobileSimpleHtml(
    blocks: MobileSimpleBlocks,
    offer: MobileSimpleOfferData,
    options?: { editorMode?: boolean },
): string {
    const editorMode = options?.editorMode ?? false
    const sections = blocks.sections
        .map(key => renderSection(key, blocks, offer, editorMode))
        .join('\n')

    return buildHtmlDocument({
        title: `${blocks.cover.projectName} — Aplikacja mobilna`,
        css: CSS,
        body: `${renderCover(blocks.cover, blocks.process, offer, editorMode)}
${sections}
${renderFooter(blocks.footer, offer, editorMode)}`,
    })
}
