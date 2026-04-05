import {Elysia} from 'elysia'
import html from '@elysiajs/html'

import {createLayout, LAYOUT_STYLESHEETS, type LayoutStylesheet} from '@/api/lib/html-layout'

const STYLE_KEYS = Object.keys(LAYOUT_STYLESHEETS) as LayoutStylesheet[]

const isLayoutStylesheet = (value: string): value is LayoutStylesheet => STYLE_KEYS.includes(value as (typeof STYLE_KEYS)[number])

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

const buildCssHref = (requestUrl: URL, stylesheet: LayoutStylesheet, customStyle?: string) => {
  const cssUrl = new URL(requestUrl)
  cssUrl.search = ''
  cssUrl.searchParams.set('format', 'css')
  cssUrl.searchParams.set('stylesheet', stylesheet)
  if (customStyle) cssUrl.searchParams.set('style', customStyle)
  return cssUrl.toString()
}

export const StyleEndpoint = <Prefix extends string>(app: Elysia<Prefix>) =>
  app.use(html()).get(
    '/style',
    ({request}) => {
      const accept = request.headers.get('accept') ?? ''
      const url = new URL(request.url)

      const stylesheetParam = url.searchParams.get('stylesheet') ?? undefined
      const selectedStylesheet = stylesheetParam && isLayoutStylesheet(stylesheetParam) ? stylesheetParam : 'pico'
      const cdnStylesheetUrl = LAYOUT_STYLESHEETS[selectedStylesheet]
      const customStyle = url.searchParams.get('style') ?? url.searchParams.get('styles') ?? undefined
      const cssHref = buildCssHref(url, selectedStylesheet, customStyle)

      const formatParam = url.searchParams.get('format')
      const wantsHtml = formatParam === 'html' || (formatParam !== 'css' && formatParam !== 'json' && accept.includes('text/html'))
      const wantsJson = formatParam === 'json' || (formatParam !== 'css' && !wantsHtml && accept.includes('application/json'))

      if (wantsJson) {
        return {
          endpoint: '/api/style',
          mode: 'json' as const,
          selectedStylesheet,
          availableStylesheets: [...STYLE_KEYS],
          customStyleProvided: Boolean(customStyle),
          stylesheetLink: cssHref,
          sourceStylesheetUrl: cdnStylesheetUrl,
          usage: {
            htmlLinkTag: `<link rel="stylesheet" href="${cssHref}">`,
            queryParams: {
              stylesheet: 'Name of built-in preset style',
              style: 'Optional custom CSS string to append',
              format: 'css | html | json',
            },
          },
        }
      }

      if (!wantsHtml) {
        return new Response(`@import url("${cdnStylesheetUrl}");\n\n${customStyle ?? ''}`.trimEnd(), {
          headers: {
            'content-type': 'text/css; charset=utf-8',
          },
        })
      }

      const escapedCssHref = escapeHtml(cssHref)
      const escapedCustomStyle = escapeHtml(customStyle ?? '')

      return new Response(
        createLayout(
          'Hub API – Style Endpoint',
          `
      <header>
        <h1>/api/style</h1>
        <p>HTML-based stylesheet endpoint. Use it directly in <code>&lt;link rel="stylesheet"&gt;</code>.</p>
      </header>

      <section>
        <h2>Main Idea</h2>
        <p>
          Instead of linking a CDN stylesheet directly, link to this endpoint:
          it resolves the chosen preset and appends your custom CSS.
        </p>
      </section>

      <section>
        <h2>Insert Into HTML</h2>
        <pre><code>&lt;link rel="stylesheet" href="${escapedCssHref}"&gt;</code></pre>
      </section>

      <section>
        <h2>Query Params</h2>
        <ul>
        <li><code>format</code> — <code>css</code>, <code>json</code>, <code>html</code></li>
          <li><code>stylesheet</code> — preset key (${STYLE_KEYS.map((key) => `<code>${key}</code>`).join(', ')})</li>
          <li><code>style</code> — optional custom CSS (URL encoded)</li>
        </ul>
      </section>

      <section>
        <h2>Examples</h2>
        <pre><code>&lt;link rel="stylesheet" href="${escapeHtml(buildCssHref(url, 'pico'))}"&gt;</code></pre>
        <pre><code>&lt;link rel="stylesheet" href="${escapeHtml(buildCssHref(url, 'water', 'main { max-width: 860px; margin: 0 auto; }'))}"&gt;</code></pre>
      </section>

      <section>
        <h2>Playground</h2>
        <label for="stylesheet-picker">Stylesheet</label>
        <select id="stylesheet-picker">
          ${STYLE_KEYS.map((key) => `<option value="${key}" ${selectedStylesheet === key ? 'selected' : ''}>${key}</option>`).join('')}
        </select>
        <label for="css-editor">Custom CSS</label>
        <textarea id="css-editor" rows="8" placeholder="main { max-width: 860px; margin: 0 auto; }">${escapedCustomStyle}</textarea>
        <p><strong>Generated href:</strong></p>
        <pre><code id="generated-href">${escapedCssHref}</code></pre>
      </section>



      <script>
        (() => {
          const picker = document.getElementById('stylesheet-picker');
          const cssEditor = document.getElementById('css-editor');
          const generatedHref = document.getElementById('generated-href');
          if (!picker || !cssEditor || !generatedHref) return;

          const baseUrl = new URL(window.location.href);
          baseUrl.search = '';

          const refreshHref = () => {
            const next = new URL(baseUrl.toString());
            next.searchParams.set('format', 'css');
            next.searchParams.set('stylesheet', picker.value);
            if (cssEditor.value.trim()) {
              next.searchParams.set('style', cssEditor.value);
            }
            generatedHref.textContent = next.toString();
          };

          picker.addEventListener('change', refreshHref);
          cssEditor.addEventListener('input', refreshHref);
          refreshHref();
        })();
      </script>
    `,
          {
            stylesheet: selectedStylesheet,
          },
        ),
        {
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        },
      )
    },
    {
      detail: {
        summary: 'Style endpoint returning CSS, HTML docs, or JSON metadata',
        description: 'Use in link tag as /api/style?format=css&stylesheet=...&style=... . Supports Accept negotiation and format query param.',
        operationId: 'getStyle',
      },
    },
  )
