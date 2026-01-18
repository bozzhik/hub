# hub (wzx.cx)

## Введение

Этот документ описывает архитектуру и план реализации для твоего домена **wzx.cx**. Основная идея — создать хаб (главную страницу) с пет-проектами, где ключевыми являются **canvas** (Notion-like инструмент для портфолио, CV и личного сайта) и **slug** (генератор коротких ссылок). Всё реализуется в трёх отдельных репозиториях: **hub**, **canvas** и **slug**.

Цель:

- Главная страница (hub) — список пет-проектов.
- Основные проекты: **canvas** (Notion-like для портфолио/CV/блога) и **slug** (генератор коротких ссылок).
- Всё под одним доменом **wzx.cx**
- Доступ к canvas: `wzx.cx/bozzhik` (username).
- Доступ к slug: `wzx.cx/abc123` (токен).
- Чтобы избежать конфликтов между usernames и токенами — специальная логика генерации токенов в slug.
- Альтернативный/тестовый доступ: `wzx.cx/?app=canvas` и `wzx.cx/?app=slug`.

**Технологии**:

- Hub: Elysia.js (лёгкий, HTML-рендеринг).
- Canvas: Next.js (UI + редактор).
- Slug: Next.js(API + редиректы).
- Хостинг: Vercel (три отдельных проекта).
- Бэкенд / данные: Convex (три отдельных Convex-проекта).
- Прокси: rewrites в Vercel (hub → canvas и slug).

## Общая архитектура

- Домен **wzx.cx** привязан только к проекту **hub**.
- Hub обрабатывает:
  - Корень `/` — список проектов.
  - Query `?app=canvas` → прокси на canvas.
  - Query `?app=slug` → прокси на slug.
  - Пути `/bozzhik`, `/abc123` и т.д. → rewrites на canvas или slug в зависимости от типа.
- Разрешение конфликтов:
  - Сначала проверяем в hub, является ли путь username (canvas).
  - Если нет — считаем токеном (slug).
  - Slug генерирует токены **только из безопасного набора символов и длины**, чтобы минимизировать коллизии (например, 6–8 символов, только lowercase + цифры, исключая возможные usernames на старте).
- Convex: три проекта (hub-convex, canvas-convex, slug-convex). Hub может читать данные из других через public queries.

## Пути и доступ (финальные)

- **Hub (главная)**: `wzx.cx`  
  → HTML-страница со списком:

  - Canvas: `<a href="/bozzhik">Портфолио bozzhik</a>`
  - Slug: примеры коротких ссылок `wzx.cx/abc123`
  - Другие мелкие проекты

- **Canvas (портфолио / CV / блог)**:

  - Основной: `wzx.cx/bozzhik` (или любой username)
  - Тест/альтернатива: `wzx.cx/?app=canvas`
  - Поддомен (опционально): `canvas.wzx.cx`
  - Внутри: `/bozzhik/cv`, `/bozzhik/blog/post1`, `/bozzhik/edit` и т.д.

- **Slug (короткие ссылки)**:
  - Основной: `wzx.cx/abc123` (просто токен → 301 редирект)
  - UI для создания: `wzx.cx/?app=slug` (форма генерации)
  - Поддомен (опционально): `slug.wzx.cx`
  - Создание: POST на `/api/create` (или через UI на `?app=slug`)

## Логика разрешения конфликтов (очень важно!)

В **hub** (Elysia.js) реализуем простой resolver:

```ts
app.get('/:path', async (c) => {
  const path = c.params.path

  // 1. Проверяем, существует ли такой username в canvas-convex
  const isUsername = await checkIfUsernameExists(path) // query в convex или кэш

  if (isUsername) {
    // Прокси на canvas
    return proxyToCanvas(c)
  }

  // 2. Иначе считаем токеном slug
  const link = await getLinkFromSlugConvex(path)
  if (link) {
    return c.redirect(link.originalUrl, 301)
  }

  // 3. 404 или fallback на hub
  return c.html('<h1>404 Not Found</h1>')
})
```

В **slug** при генерации токена:

- Длина: 6–8 символов
- Символы: a-z0-9 (36 вариантов)
- Проверять коллизию с существующими usernames (query в canvas-convex)
- Если коллизия → генерировать новый
- Можно добавить префикс/суффикс в редких случаях, но стараться избегать

## Репозитории и структура

### 1. hub

- Репо: hub
- Фреймворк: Elysia.js + Bun
- vercel.json:

```json
{
  "rewrites": [
    {"source": "/?app=canvas", "destination": "https://canvas-xxx.vercel.app/"},
    {"source": "/?app=slug", "destination": "https://slug-yyy.vercel.app/"},
    {"source": "/:path*", "destination": "/"} // catch-all обрабатывается в коде
  ]
}
```

- Логика resolver (см. выше) в `src/index.ts`
- Convex: hub-convex (для списка проектов, если динамика)

### 2. canvas

- Репо: canvas
- Фреймворк: Next.js (рекомендую)
- next.config.js:

```js
module.exports = {
  basePath: '', // без basePath, т.к. пути относительные
  // но assets и links должны учитывать, что они под wzx.cx/username
}
```

- Роуты: `/[username]/page.tsx` (dashboard), `/[username]/cv`, etc.
- Convex: canvas-convex
  - Tables: users (username unique), pages, blocks

### 3. slug

- Репо: slug
- Фреймворк: Elysia.js
- Роуты:
  - GET /:token → 301 редирект
  - GET /?app=slug → UI-форма (HTML в Elysia)
  - POST /api/create → генерирует токен, проверяет коллизии
- Convex: slug-convex
  - Table: links (token unique, originalUrl, clicks, createdAt)

## Шаги реализации

1. Создай три репо: hub, canvas, slug
2. Для каждого: настрой Vercel, Convex (npx convex dev)
3. В slug: реализуй генерацию токена с проверкой на username (HTTP-запрос к canvas-convex API)
4. В hub: реализуй resolver-проверку (query к canvas-convex + slug-convex)
5. Тестируй локально → deploy → обнови vercel.json в hub
6. DNS: wzx.cx → только hub
7. Добавь в hub список проектов с реальными ссылками
