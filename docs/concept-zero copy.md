### Concept for "BareHTML CSS" Framework

Your idea draws from minimalistic frameworks like Pico CSS, which styles native HTML elements without requiring classes, keeping things lightweight and semantic. However, instead of Pico's modern, opinionated minimalism (e.g., subtle borders, sans-serif fonts, and responsive tweaks), "BareHTML CSS" would emulate the raw, unstyled look of "HTML-only" sites—think early web pages from the 90s or default browser rendering. This means enforcing a consistent, nostalgic aesthetic: black text on white, underlined blue links (purple for visited), serif fonts for a classic feel, generous margins, and no fancy effects like shadows, transitions, or rounded corners.

**Key Principles:**

- **Classless**: No need for custom classes; it directly targets HTML tags (e.g., `<a>`, `<h1>`, `<input>`).
- **Minimalist and Retro**: Mimics browser defaults but normalizes them across browsers for consistency. Uses serif fonts (like Times New Roman) to evoke old-school web, avoids modern flourishes.
- **Lightweight**: Under 1KB, no dependencies, easy to drop into any project.
- **Semantic Focus**: Encourages pure HTML structure without div-soup or JS reliance.
- **Use Cases**: Quick prototypes, personal blogs, documentation sites, or anywhere you want a "no-frills" vibe similar to the shadcn.com page you shared (bare links, simple forms, lists without bullets styled fancy).
- **Differences from Pico**: Pico adds subtle modern polish (e.g., border-radius on buttons, variable fonts); BareHTML strips it back to essentials, prioritizing raw readability over elegance.
- **Implementation**: Include via `<link rel="stylesheet" href="barehtml.css">`. It includes a basic reset to neutralize browser inconsistencies, then applies classic styles.

This framework would style **all standard HTML elements** to ensure nothing looks out of place. Below is the complete CSS code you can use as a starting point. It's based on the shadcn.com page's appearance (black text, blue underlined links, white space, simple form) and extended to cover everything.

```css
/* BareHTML CSS v1.0 - A classless framework for HTML-only style sites */

/* Basic Reset: Normalize margins, paddings, and box-sizing for consistency */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px; /* Base font size */
}

body {
  font-family: 'Times New Roman', Times, serif; /* Classic serif for retro feel */
  line-height: 1.5;
  color: #000000; /* Black text */
  background-color: #ffffff; /* White background */
  margin: 8px; /* Default browser margin */
  padding: 0;
}

/* Headings: Bold, with decreasing sizes and margins */
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: inherit;
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 2em;
}
h2 {
  font-size: 1.5em;
}
h3 {
  font-size: 1.17em;
}
h4 {
  font-size: 1em;
}
h5 {
  font-size: 0.83em;
}
h6 {
  font-size: 0.67em;
}

/* Paragraphs and text blocks */
p {
  margin-bottom: 1em;
}

blockquote {
  margin: 1em 40px;
  font-style: italic;
}

pre {
  font-family: monospace;
  background-color: #f0f0f0; /* Light gray for code blocks */
  padding: 1em;
  overflow: auto;
}

code,
kbd,
samp {
  font-family: monospace;
}

/* Links: Classic blue underline, purple visited */
a {
  color: #0000ff; /* Blue */
  text-decoration: underline;
}

a:visited {
  color: #800080; /* Purple */
}

a:hover,
a:active {
  color: #ff0000; /* Red on hover for feedback */
}

/* Lists: Standard bullets/numbers with indentation */
ul,
ol {
  margin: 1em 0;
  padding-left: 40px;
}

ul {
  list-style-type: disc;
}
ol {
  list-style-type: decimal;
}

li {
  margin-bottom: 0.5em;
}

dl {
  margin: 1em 0;
}

dt {
  font-weight: bold;
}

dd {
  margin-left: 40px;
  margin-bottom: 0.5em;
}

/* Tables: Basic borders for clarity */
table {
  border-collapse: collapse;
  margin: 1em 0;
}

th,
td {
  border: 1px solid #000000;
  padding: 0.5em;
}

th {
  font-weight: bold;
  background-color: #f0f0f0;
}

/* Forms: Simple, default-like inputs */
form {
  margin: 1em 0;
}

label {
  display: block;
  margin-bottom: 0.5em;
}

input[type='text'],
input[type='email'],
input[type='password'],
input[type='search'],
input[type='url'],
input[type='number'],
textarea,
select {
  font-family: inherit;
  font-size: 1em;
  padding: 0.25em;
  border: 1px solid #000000; /* Black border */
  background-color: #ffffff;
  color: #000000;
}

input[type='submit'],
input[type='button'],
button {
  font-family: inherit;
  font-size: 1em;
  padding: 0.25em 0.5em;
  border: 1px solid #000000;
  background-color: #f0f0f0; /* Light gray */
  color: #000000;
  cursor: pointer;
}

input[type='submit']:hover,
input[type='button']:hover,
button:hover {
  background-color: #e0e0e0;
}

/* Images and media */
img {
  max-width: 100%;
  height: auto;
  border: 0; /* No border by default */
}

figure {
  margin: 1em 0;
}

figcaption {
  text-align: center;
  font-style: italic;
  font-size: 0.9em;
}

/* Horizontal rule */
hr {
  border: 0;
  border-top: 1px solid #000000;
  margin: 1em 0;
}

/* Inline elements */
strong {
  font-weight: bold;
}
em {
  font-style: italic;
}
del {
  text-decoration: line-through;
}
ins {
  text-decoration: underline;
}
sub,
sup {
  font-size: 0.75em;
  line-height: 0;
}
sub {
  vertical-align: sub;
}
sup {
  vertical-align: super;
}

/* Accessibility tweaks */
:focus {
  outline: 1px dotted #000000; /* Simple focus ring */
}
```

This CSS captures the essence of the shadcn.com page (minimal layout, blue links, black text, simple form) while extending it to all elements. You can tweak it—e.g., switch to sans-serif if you prefer modern defaults (`font-family: Arial, Helvetica, sans-serif;`). Test it by applying to plain HTML; it should look "naked" but consistent. If you need additions like responsive media queries or more retro elements (e.g., marquee support), let me know!

Вот обновлённая концепция и CSS для твоего "BareHTML CSS" фреймворка, где мы полностью переходим на **моноширинные (monospace) шрифты**, включая Geist Mono как основной.

### Почему Geist Mono + fallback на system mono

- Geist Mono — современный, чистый, очень читаемый monospace шрифт от Vercel (создан специально для кода и интерфейсов).
- Он выглядит минималистично и технично, но при этом не "старомодно-пиксельно".
- Идеально вписывается в эстетику "голого HTML" — всё выглядит как код/терминал/документация.
- Fallback: `ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace` — это стандартный стек безопасных системных моноширинных шрифтов.

### Обновлённый CSS

Добавил `@import` для Geist Mono (как ты просил), заменил `font-family` на моноширинный стек **везде**, где это имеет смысл (body, headings, inputs, code, pre и т.д.). Теперь весь сайт будет в одном моноширинном стиле — это усиливает "raw HTML / terminal-like" ощущение.

```css
/* BareHTML CSS v1.1 - Monospace-only version */

/* Импорт Geist Mono (weights 100–900) */
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');

/* Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  font-family: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  line-height: 1.5;
  color: #000000;
  background-color: #ffffff;
  margin: 8px;
}

/* Headings — тоже monospace, жирность через weight */
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: inherit;
  font-weight: 700; /* или можно играть с 500/600/800 для разных уровней */
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

h1 {
  font-size: 2.5em;
}
h2 {
  font-size: 2em;
  font-weight: 600;
}
h3 {
  font-size: 1.6em;
  font-weight: 500;
}
h4 {
  font-size: 1.3em;
}
h5 {
  font-size: 1.1em;
}
h6 {
  font-size: 1em;
  font-weight: 400;
}

/* Текст */
p {
  margin-bottom: 1em;
}

blockquote {
  margin: 1em 2em;
  padding-left: 1em;
  border-left: 3px solid #000;
  font-style: normal; /* в моно нет особого смысла в italic */
}

pre,
code,
kbd,
samp {
  font-family: inherit;
  background-color: #f5f5f5;
  padding: 0.1em 0.3em;
}

pre {
  padding: 1em;
  overflow: auto;
  border: 1px solid #ddd;
}

/* Ссылки — классика */
a {
  color: #0000ff;
  text-decoration: underline;
}

a:visited {
  color: #800080;
}

a:hover,
a:active {
  color: #ff0000;
}

/* Списки */
ul,
ol {
  margin: 1em 0;
  padding-left: 2em;
}

ul {
  list-style-type: disc;
}
ol {
  list-style-type: decimal;
}

/* Таблицы */
table {
  border-collapse: collapse;
  margin: 1em 0;
}

th,
td {
  border: 1px solid #000;
  padding: 0.5em;
}

th {
  background-color: #f0f0f0;
  font-weight: 600;
}

/* Формы — всё в моно */
input[type='text'],
input[type='email'],
input[type='password'],
input[type='search'],
input[type='url'],
input[type='number'],
textarea,
select {
  font-family: inherit;
  font-size: 1em;
  padding: 0.4em 0.6em;
  border: 1px solid #000;
  background: #fff;
}

input[type='submit'],
input[type='button'],
button {
  font-family: inherit;
  font-weight: 500;
  padding: 0.4em 0.8em;
  border: 1px solid #000;
  background: #f0f0f0;
  cursor: pointer;
}

button:hover,
input[type='submit']:hover,
input[type='button']:hover {
  background: #e0e0e0;
}

/* Дополнительно */
hr {
  border: 0;
  border-top: 1px solid #000;
  margin: 1.5em 0;
}

img {
  max-width: 100%;
  height: auto;
}

figure {
  margin: 1em 0;
  text-align: center;
}

figcaption {
  font-size: 0.9em;
  color: #444;
}

/* Фокус */
:focus {
  outline: 2px solid #000;
  outline-offset: -2px;
}
```

### Что изменилось и почему так

- Всё в `'Geist Mono', ... monospace` — единый моноширинный стиль.
- Убрал `Times New Roman` полностью.
- Headings стали чуть крупнее и с разными весами, чтобы отличались визуально (всё равно моно).
- `pre` и `code` теперь почти не отличаются от основного текста — только фон/отступы.
- Формы и кнопки тоже в Geist Mono — выглядит технично и последовательно.

Если хочешь ещё "терминальнее" — можно:

- Добавить `letter-spacing: 0.02em;` в body
- Поменять фон body на `#fafafa` или `#000` с белым текстом
- Добавить `font-variant-ligatures: common-ligatures;` (Geist Mono их поддерживает)

Просто кинь `<link rel="stylesheet" href="barehtml-mono.css">` или вставь `<style>` с этим кодом — и весь твой HTML будет выглядеть как минималистичный код/документация в стиле shadcn.com, но полностью моноширинный. Готово к тесту!
