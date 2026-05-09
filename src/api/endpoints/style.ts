import {Elysia} from 'elysia'
import html from '@elysiajs/html'
import {staticPlugin} from '@elysiajs/static'
import {join} from 'node:path'

import {createLayout, LAYOUT_STYLESHEETS, type LayoutStylesheet} from '@/api/lib/html-layout'

const STYLE_KEYS = Object.keys(LAYOUT_STYLESHEETS) as LayoutStylesheet[]
const stylesheetsRoot = join(process.cwd(), 'src/api/lib/stylesheets')

const isLayoutStylesheet = (value: string): value is LayoutStylesheet => STYLE_KEYS.includes(value as (typeof STYLE_KEYS)[number])

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

const buildCssHref = (requestUrl: URL, stylesheet: LayoutStylesheet, customStyle?: string) => {
  const search = new URLSearchParams()
  search.set('format', 'css')
  search.set('stylesheet', stylesheet)
  if (customStyle) search.set('style', customStyle)
  return `${requestUrl.pathname}?${search.toString()}`
}

const resolveStylesheetHref = (stylesheet: LayoutStylesheet) => {
  return LAYOUT_STYLESHEETS[stylesheet]
}

export const StyleEndpoint = <Prefix extends string>(app: Elysia<Prefix>) =>
  app
    .use(
      staticPlugin({
        assets: stylesheetsRoot,
        prefix: '/style/presets',
        indexHTML: false,
        headers: {
          'content-type': 'text/css; charset=utf-8',
          'cache-control': 'no-store',
        },
      }),
    )
    .use(html())
    .get(
      '/style',
      ({request}) => {
        const accept = request.headers.get('accept') ?? ''
        const url = new URL(request.url)

        const stylesheetParam = url.searchParams.get('stylesheet') ?? undefined
        const selectedStylesheet = stylesheetParam && isLayoutStylesheet(stylesheetParam) ? stylesheetParam : 'pico'
        const resolvedStylesheetHref = resolveStylesheetHref(selectedStylesheet)
        const customStyle = url.searchParams.get('style') ?? url.searchParams.get('styles') ?? undefined

        const cssHref = buildCssHref(url, selectedStylesheet, customStyle)
        const cssHrefAbsolute = new URL(cssHref, url.origin).toString()
        const stylesheetHrefMap = Object.fromEntries(STYLE_KEYS.map((key) => [key, resolveStylesheetHref(key)]))

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
            stylesheetLinkAbsolute: cssHrefAbsolute,
            sourceStylesheetUrl: resolvedStylesheetHref,
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
          return new Response(`@import url("${resolvedStylesheetHref}");\n\n${customStyle ?? ''}`.trimEnd(), {
            headers: {
              'content-type': 'text/css; charset=utf-8',
              'cache-control': 'no-store',
            },
          })
        }

        const escapedCssHref = escapeHtml(cssHref)
        const escapedCustomStyle = escapeHtml(customStyle ?? '')

        return new Response(
          createLayout(
            'Hub API – Style Endpoint',
            `
      <section>
        <h2>HTML-Based CSS Framework Presets</h2>
        <p>Select a preset to preview how this page looks with different HTML-based CSS frameworks.</p>
        <p>
          ${STYLE_KEYS.map((key) => `<button type="button" class="style-switch-btn" data-style="${key}" ${selectedStylesheet === key ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${key}</button>`).join('\n')}
        </p>
      </section>

      <header>
        <h1>/api/style</h1>
        <p>Endpoint for serving stylesheet links and CSS output for HTML-based CSS frameworks.</p>
      </header>

      <section>
        <h2>How It Works</h2>
        <p>
          Instead of linking framework CSS directly, use this endpoint in your <code>&lt;link rel="stylesheet"&gt;</code>.
          It resolves the selected preset and appends your optional custom CSS.
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
        <pre><code>&lt;link rel="stylesheet" href="${escapeHtml(buildCssHref(url, 'mini', 'main { max-width: 860px; margin: 0 auto; }'))}"&gt;</code></pre>
      </section>

      <section>
        <h2>Playground</h2>
        <label for="stylesheet-picker">Framework preset</label>
        <select id="stylesheet-picker">
          ${STYLE_KEYS.map((key) => `<option value="${key}" ${selectedStylesheet === key ? 'selected' : ''}>${key}</option>`).join('')}
        </select>
        <label for="css-editor">Custom CSS override</label>
        <textarea id="css-editor" rows="8" placeholder="main { max-width: 860px; margin: 0 auto; }">${escapedCustomStyle}</textarea>
        <p><strong>Generated href:</strong></p>
        <pre><code id="generated-href">${escapedCssHref}</code></pre>
      </section>

      <script>
        (() => {
          const stylesheetMap = ${JSON.stringify(stylesheetHrefMap)};
          const picker = document.getElementById('stylesheet-picker');
          const cssEditor = document.getElementById('css-editor');
          const generatedHref = document.getElementById('generated-href');
          const themeLink = document.getElementById('theme-stylesheet');
          const switchButtons = Array.from(document.querySelectorAll('.style-switch-btn'));
          if (!picker || !cssEditor || !generatedHref || !themeLink) return;

          const baseUrl = new URL(window.location.href);
          baseUrl.search = '';

          const updateButtons = (nextStyle) => {
            switchButtons.forEach((button) => {
              const isActive = button.getAttribute('data-style') === nextStyle;
              button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
          };

          const refreshHref = () => {
            const next = new URL(baseUrl.toString());
            next.searchParams.set('format', 'css');
            next.searchParams.set('stylesheet', picker.value);
            if (cssEditor.value.trim()) {
              next.searchParams.set('style', cssEditor.value);
            }
            generatedHref.textContent = next.toString();
            if (stylesheetMap[picker.value]) {
              themeLink.setAttribute('href', stylesheetMap[picker.value]);
            }
            updateButtons(picker.value);
          };

          picker.addEventListener('change', refreshHref);
          cssEditor.addEventListener('input', refreshHref);

          switchButtons.forEach((button) => {
            button.addEventListener('click', () => {
              const nextStyle = button.getAttribute('data-style');
              if (!nextStyle) return;
              picker.value = nextStyle;
              refreshHref();
            });
          });

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
              'cache-control': 'no-store',
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
