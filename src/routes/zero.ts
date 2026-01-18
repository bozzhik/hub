import {Elysia} from 'elysia'
import {html} from '@elysiajs/html'
import {readFileSync} from 'fs'
import {join} from 'path'

// Available styles
const STYLES = {
  zero: 'zero',
  minimal: 'minimal',
  pico: 'https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css',
  water: 'https://cdn.jsdelivr.net/npm/water.css@2/out/water.css',
  sakura: 'https://cdn.jsdelivr.net/npm/sakura.css/css/sakura.css',
  almond: 'https://cdn.jsdelivr.net/gh/alvaromontoro/almond.css@latest/dist/almond.lite.min.css',
  tacit: 'https://cdn.jsdelivr.net/gh/yegor256/tacit@gh-pages/tacit-css-1.9.5.min.css',
}

export const zeroRoute = new Elysia()
  .use(html())
  .get('/zero', ({html, query}) => {
    const style = (query.style as string) || 'zero'

    // Check if it's a local style or external
    const isLocalStyle = ['zero', 'minimal'].includes(style)
    const cssUrl = isLocalStyle ? `/zero.css?style=${style}` : STYLES[style as keyof typeof STYLES]

    return html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>zero - minimal classless CSS framework</title>
    <link rel="stylesheet" href="${cssUrl}">
</head>
<body>
    <main style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
        <header style="text-align: center; margin-bottom: 3rem;">
            <h1>zero</h1>
            <p>minimal classless CSS framework inspired by shadcn/ui and HTML-only sites</p>

            <nav style="margin-top: 2rem;">
                <p>Choose style:</p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-top: 1rem;">
                    ${Object.keys(STYLES)
                      .map(
                        (s) => `
                        <a href="/zero?style=${s}" style="padding: 0.5rem 1rem; border: 1px solid; text-decoration: none; ${style === s ? 'background: currentColor; color: white;' : ''}">
                            ${s}
                        </a>
                    `,
                      )
                      .join('')}
                </div>
            </nav>
        </header>

        <section>
            <h2>Installation</h2>
            <p>Add this to your HTML:</p>
            <pre><code>&lt;link rel="stylesheet" href="https://zero.wzx.cx/zero.css?style=${style}"&gt;</code></pre>
        </section>

        <section>
            <h2>Showcase</h2>

            <article>
                <h3>Article Card</h3>
                <p>This is how articles look with the current style.</p>
            </article>

            <h3>Typography</h3>
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <h4>Heading 4</h4>
            <h5>Heading 5</h5>
            <h6>Heading 6</h6>
            <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
            <blockquote>Blockquote text</blockquote>
            <p>Code: <code>inline code</code></p>
            <pre><code>preformatted
code block</code></pre>

            <h3>Links</h3>
            <p><a href="#">Normal link</a> <a href="#" style="color: purple;">Visited link</a></p>

            <h3>Buttons</h3>
            <button>Button</button>
            <input type="submit" value="Submit">
            <input type="button" value="Input Button">

            <h3>Forms</h3>
            <form>
                <label>Text Input</label>
                <input type="text" placeholder="Enter text">

                <label>Email</label>
                <input type="email" placeholder="Enter email">

                <label>Textarea</label>
                <textarea placeholder="Enter text"></textarea>

                <label>Select</label>
                <select>
                    <option>Option 1</option>
                    <option>Option 2</option>
                </select>

                <label>Checkboxes</label>
                <input type="checkbox" id="check1">
                <label for="check1">Checkbox 1</label>
                <input type="checkbox" id="check2">
                <label for="check2">Checkbox 2</label>

                <label>Radio buttons</label>
                <input type="radio" name="radio" id="radio1">
                <label for="radio1">Radio 1</label>
                <input type="radio" name="radio" id="radio2">
                <label for="radio2">Radio 2</label>
            </form>

            <h3>Lists</h3>
            <ul>
                <li>Unordered list item</li>
                <li>Another item</li>
                <li>Third item</li>
            </ul>

            <ol>
                <li>Ordered list item</li>
                <li>Another item</li>
                <li>Third item</li>
            </ol>

            <h3>Table</h3>
            <table>
                <thead>
                    <tr>
                        <th>Header 1</th>
                        <th>Header 2</th>
                        <th>Header 3</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Data 1</td>
                        <td>Data 2</td>
                        <td>Data 3</td>
                    </tr>
                    <tr>
                        <td>Data 4</td>
                        <td>Data 5</td>
                        <td>Data 6</td>
                    </tr>
                </tbody>
            </table>

            <h3>Details/Accordion</h3>
            <details>
                <summary>Accordion Item 1</summary>
                <p>Content for accordion item 1</p>
            </details>
            <details>
                <summary>Accordion Item 2</summary>
                <p>Content for accordion item 2</p>
            </details>

            <h3>Horizontal Rule</h3>
            <hr>

            <h3>Images</h3>
            <figure>
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZGRkIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGxhY2Vob2xkZXIgSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==" alt="Placeholder image">
                <figcaption>Figure caption</figcaption>
            </figure>
        </section>

        <footer style="text-align: center; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid;">
            <p><a href="/">← back to hub</a></p>
        </footer>
    </main>
</body>
</html>`)
  })
  .get('/zero.css', ({query, set}) => {
    set.headers['Content-Type'] = 'text/css'
    const style = (query.style as string) || 'zero'

    if (style === 'zero') {
      try {
        return readFileSync(join(process.cwd(), 'src/styles/zero.css'), 'utf8')
      } catch {
        return '/* Error loading zero.css */'
      }
    } else if (style === 'minimal') {
      try {
        return readFileSync(join(process.cwd(), 'src/styles/minimal.css'), 'utf8')
      } catch {
        return '/* Error loading minimal.css */'
      }
    } else {
      // For external styles, redirect to the actual URL
      const externalUrl = STYLES[style as keyof typeof STYLES]
      if (externalUrl && typeof externalUrl === 'string' && externalUrl.startsWith('http')) {
        // For external URLs, we need to proxy or redirect
        // For now, return a comment with the URL
        return `/* External style: ${style} */
/* Load from: ${externalUrl} */
/* @import "${externalUrl}"; */`
      } else {
        return `/* Style "${style}" not found. Available: ${Object.keys(STYLES).join(', ')} */`
      }
    }
  })
