const STYLES = {
  pico: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">',
  water: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">',
  sakura: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sakura.css/css/sakura.css" type="text/css">',
  almond: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/alvaromontoro/almond.css@latest/dist/almond.lite.min.css" />',
  tacit: '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/yegor256/tacit@gh-pages/tacit-css-1.9.5.min.css"/>',
}

export const createLayout = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${STYLES.sakura}
</head>
<body>
    <main class="container">
        ${content}
    </main>
</body>
</html>`
