import {Elysia} from 'elysia'
import html from '@elysiajs/html'

import {createLayout, LAYOUT_STYLESHEETS, type LayoutStylesheet} from '@/api/lib/html-layout'

const STYLE_KEYS = Object.keys(LAYOUT_STYLESHEETS) as LayoutStylesheet[]

const isLayoutStylesheet = (value: string): value is LayoutStylesheet => STYLE_KEYS.includes(value as (typeof STYLE_KEYS)[number])

export const DemoHtmlEndpoint = <Prefix extends string>(app: Elysia<Prefix>) =>
  app.use(html()).get(
    '/demo/html',
    ({request}) => {
      const accept = request.headers.get('accept') ?? ''
      const wantsJson = accept.includes('application/json') && !accept.includes('text/html')

      const url = new URL(request.url)
      const stylesheetParam = url.searchParams.get('stylesheet') ?? undefined

      const selectedStylesheet = stylesheetParam && isLayoutStylesheet(stylesheetParam) ? stylesheetParam : 'pico'

      const customStyles = url.searchParams.get('styles') ?? undefined

      if (wantsJson) {
        return {
          endpoint: '/api/demo/html',
          mode: 'json' as const,
          message: 'Send Accept: text/html to get rendered Hub HTML content.',
          availableStylesheets: [...STYLE_KEYS],
          selectedStylesheet,
          customStylesProvided: Boolean(customStyles),
        }
      }

      return new Response(
        createLayout(
          'Hub API – Demo HTML',
          `
      <header>
        <h1>Hub</h1>
        <p>A compact workspace for ideas, experiments, and fast product drafts.</p>
      </header>

      <article>
        <h2>What Hub Is About</h2>
        <p>
          Hub focuses on short feedback loops: write a small feature, validate behavior,
          and improve the structure before the project grows.
        </p>
        <blockquote>
          Build small, validate early, improve continuously.
        </blockquote>
      </article>

      <section>
        <h3>Core Workflow</h3>
        <ol>
          <li>Define one small goal.</li>
          <li>Implement a thin vertical slice.</li>
          <li>Check quality and simplify.</li>
        </ol>
      </section>

      <section>
        <h3>Current Focus</h3>
        <ul>
          <li>Modular API endpoints</li>
          <li>Readable project structure</li>
          <li>Reliable validation checks</li>
        </ul>
      </section>

      <section>
        <h3>Readiness Snapshot</h3>
        <label for="hub-progress">Iteration progress</label>
        <progress id="hub-progress" value="72" max="100">72%</progress>
        <p><small>Current completion level: <strong>72%</strong></small></p>
        <label for="quality-meter">Quality confidence</label>
        <meter id="quality-meter" min="0" max="100" value="84">84</meter>
      </section>

      <section>
        <h3>Iteration Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>API Structure</td>
              <td>Stable</td>
              <td>Composable endpoint modules</td>
            </tr>
            <tr>
              <td>Type Safety</td>
              <td>Good</td>
              <td>Validated during build checks</td>
            </tr>
            <tr>
              <td>UX Layer</td>
              <td>Evolving</td>
              <td>Demonstration-oriented page</td>
            </tr>
          </tbody>
        </table>
      </section>

      <details>
        <summary>Implementation Note</summary>
        <p>
          This page is rendered on the server and can be restyled via query parameters:
          <code>stylesheet</code> and <code>styles</code>.
        </p>
      </details>

      <figure>
        <pre><code>status: active
mode: iterative
goal: ship clear interfaces</code></pre>
        <figcaption>Hub operating profile</figcaption>
      </figure>

      <section>
        <h2>Live Style Playground</h2>
        <p>Use controls below to switch stylesheet and add custom CSS in real time.</p>
        <label for="stylesheet-picker">Stylesheet</label>
        <select id="stylesheet-picker">
          ${STYLE_KEYS.map((key) => `<option value="${key}" ${selectedStylesheet === key ? 'selected' : ''}>${key}</option>`).join('')}
        </select>
        <label for="css-editor">Custom CSS</label>
        <textarea id="css-editor" rows="8" placeholder=".container { max-width: 900px; }">${customStyles ?? ''}</textarea>
        <button id="apply-css" type="button">Apply CSS</button>
      </section>

      <script>
        (() => {
          const stylesheetMap = ${JSON.stringify(LAYOUT_STYLESHEETS)};
          const picker = document.getElementById('stylesheet-picker');
          const cssEditor = document.getElementById('css-editor');
          const applyButton = document.getElementById('apply-css');
          const themeLink = document.getElementById('theme-stylesheet');
          const customStyleTag = document.getElementById('custom-style');

          if (!picker || !cssEditor || !applyButton || !themeLink || !customStyleTag) return;

          picker.addEventListener('change', () => {
            const key = picker.value;
            if (stylesheetMap[key]) {
              themeLink.setAttribute('href', stylesheetMap[key]);
            }
          });

          applyButton.addEventListener('click', () => {
            customStyleTag.textContent = cssEditor.value;
          });
        })();
      </script>
    `,
          {
            stylesheet: selectedStylesheet,
            styles: customStyles,
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
        summary: 'Hub HTML demo with dynamic stylesheet and custom CSS',
        description: 'Returns JSON for API clients and rendered HTML for browsers. Supports query params: stylesheet, styles.',
        operationId: 'getDemoHtml',
      },
    },
  )
