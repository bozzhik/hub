const STYLESHEETS = {
  pico: 'https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css',
  water: 'https://cdn.jsdelivr.net/npm/water.css@2/out/water.css',
  sakura: 'https://cdn.jsdelivr.net/npm/sakura.css/css/sakura.css',
  almond: 'https://cdn.jsdelivr.net/gh/alvaromontoro/almond.css@latest/dist/almond.lite.min.css',
  tacit: 'https://cdn.jsdelivr.net/gh/yegor256/tacit@gh-pages/tacit-css-1.9.5.min.css',
  zero: '/api/style/presets/zero.css',
  mini: '/api/style/presets/mini.css',
}

export type LayoutStylesheet = keyof typeof STYLESHEETS
export const LAYOUT_STYLESHEETS = STYLESHEETS

interface LayoutOptions {
  stylesheet?: LayoutStylesheet
  styles?: string
}

const isStylesheetKey = (value: string): value is LayoutStylesheet => value in STYLESHEETS

export const createLayout = (title: string, content: string, options: LayoutOptions = {}) => {
  const stylesheet = options.stylesheet && isStylesheetKey(options.stylesheet) ? options.stylesheet : 'pico'
  const customStyles = options.styles?.trim()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link id="theme-stylesheet" rel="stylesheet" href="${STYLESHEETS[stylesheet]}">
    <style id="custom-style">${customStyles ?? ''}</style>
</head>
<body>
    <main class="container">
        ${content}
    </main>
</body>
</html>`.trim()
}
