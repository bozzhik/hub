### Zero CSS Framework - Classless HTML Styling

Zero is a collection of minimal classless CSS frameworks inspired by shadcn/ui and HTML-only sites. It provides two main styles plus external framework support.

#### Available Styles

1. **`zero`** - BareHTML style (retro, monospace, HTML-only aesthetic)

   - Inspired by early web and terminal aesthetics
   - Geist Mono font for technical feel
   - Black/white color scheme with classic link styling

2. **`minimal`** - Modern ShadHTML style

   - Inspired by shadcn/ui design system
   - System fonts with CSS variables
   - Light/dark mode support

3. **External frameworks** via parameters:
   - `pico` - Pico CSS
   - `water` - Water CSS
   - `sakura` - Sakura CSS
   - `almond` - Almond CSS
   - `tacit` - Tacit CSS

#### Key Principles

- **Classless**: Styles native HTML elements without requiring classes
- **Multiple Aesthetics**: Choose between retro and modern looks
- **Framework Agnostic**: Can serve external CSS frameworks
- **Complete Coverage**: Styles all standard HTML elements
- **URL Parameters**: Switch styles dynamically via query parameters

#### API Usage

**Demo page:**

```
GET https://zero.wzx.cx/zero?style={style_name}
```

**CSS endpoint:**

```
GET https://zero.wzx.cx/zero.css?style={style_name}
```

**Available styles:** `zero`, `minimal`, `pico`, `water`, `sakura`, `almond`, `tacit`

**Default style:** `zero` (if no parameter provided)

#### HTML Integration

```html
<!-- Local Zero styles -->
<link rel="stylesheet" href="https://zero.wzx.cx/zero.css?style=zero" />
<link rel="stylesheet" href="https://zero.wzx.cx/zero.css?style=minimal" />

<!-- External frameworks -->
<link rel="stylesheet" href="https://zero.wzx.cx/zero.css?style=pico" />
<link rel="stylesheet" href="https://zero.wzx.cx/zero.css?style=sakura" />
```

#### Implementation Status

**✅ LIVE** and ready for production use

**Location:** `https://zero.wzx.cx/`

**Technology Stack:**

- Elysia.js backend serving CSS
- Multiple CSS frameworks supported
- URL parameter-based style switching
- Hosted on wzx.cx infrastructure

#### Zero Style (BareHTML) - Retro Monospace

```css
/* BareHTML CSS v1.1 - Monospace-only version */

/* Импорт Geist Mono (weights 100–900) */
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap');

/* Basic reset and monospace styling */
/* ... full CSS in src/styles/zero.css ... */
```

**Characteristics:**

- Geist Mono font throughout
- Black text on white background
- Classic blue/purple link colors
- Terminal/tech aesthetic
- No borders, shadows, or modern effects

#### Minimal Style (ShadHTML) - Modern System Fonts

```css
/* ShadHTML: Classless CSS Framework inspired by shadcn/ui */

/* CSS variables and modern styling */
/* ... full CSS in src/styles/minimal.css ... */
```

**Characteristics:**

- System fonts (-apple-system, etc.)
- CSS variables for theming
- Light/dark mode support
- Rounded corners and subtle shadows
- Modern accessibility features

#### Usage Examples

**Basic HTML with Zero style:**

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://zero.wzx.cx/zero.css?style=zero" />
  </head>
  <body>
    <h1>Hello World</h1>
    <p>This is styled with Zero framework</p>
    <button>Click me</button>
  </body>
</html>
```

**Same HTML with Minimal style:**

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="https://zero.wzx.cx/zero.css?style=minimal" />
  </head>
  <body>
    <h1>Hello World</h1>
    <p>This is styled with Minimal framework</p>
    <button>Click me</button>
  </body>
</html>
```

#### Complete HTML Element Coverage

Both styles support all standard HTML elements:

- **Typography:** `h1-h6`, `p`, `blockquote`, `pre`, `code`
- **Links:** `a` (normal, visited, hover states)
- **Lists:** `ul`, `ol`, `dl`
- **Tables:** `table`, `th`, `td`, `tr`
- **Forms:** `input`, `textarea`, `select`, `label`, `button`
- **Interactive:** `details`/`summary` (accordions), `checkbox`, `radio`
- **Media:** `img`, `figure`, `figcaption`
- **Structure:** `article`, `section`, `header`, `footer`, `nav`
- **Utilities:** `hr`, `strong`, `em`, `sub`, `sup`

#### Development

**Project Structure:**

```
src/
├── routes/
│   └── zero.ts          # API routes and HTML generation
├── styles/
│   ├── zero.css         # BareHTML monospace style
│   └── minimal.css      # Modern shadcn-inspired style
└── index.ts             # Main app entry point
```

**Adding New Styles:**

1. Create CSS file in `src/styles/`
2. Add to STYLES object in `zero.ts`
3. Update API documentation

This framework provides a complete solution for classless HTML styling with multiple aesthetic options, from retro terminal looks to modern design systems.
