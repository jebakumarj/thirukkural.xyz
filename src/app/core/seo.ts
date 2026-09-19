import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export const SITE_ORIGIN = 'https://thirukkural.xyz';
export const SITE_NAME = 'திருக்குறள்';
export const SITE_IMAGE = `${SITE_ORIGIN}/icons/og-image.png`;

export interface PageMeta {
  readonly title: string;
  readonly description: string;
  /** Route path without the leading origin, e.g. `/kural/42`. */
  readonly path: string;
  /** Structured data for this page, emitted as JSON-LD. */
  readonly jsonLd?: Record<string, unknown>;
}

/**
 * Every route is prerendered, so titles, descriptions, canonicals and
 * structured data are baked into the HTML that crawlers and link previews see.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  apply(page: PageMeta): void {
    const fullTitle = page.path === '/' ? `${SITE_NAME} — ${page.title}` : `${page.title} | ${SITE_NAME}`;
    const url = SITE_ORIGIN + page.path;

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'ta_IN' });
    this.meta.updateTag({ property: 'og:image', content: SITE_IMAGE });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:image', content: SITE_IMAGE });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });

    this.setCanonical(url);
    this.setJsonLd(page.jsonLd);
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      head.appendChild(link);
    }
    link.href = url;
  }

  private setJsonLd(data: Record<string, unknown> | undefined): void {
    const head = this.document.head;
    const existing = head.querySelector('script[data-seo-jsonld]');
    existing?.remove();
    if (!data) return;
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-jsonld', '');
    script.textContent = JSON.stringify(data);
    head.appendChild(script);
  }
}
