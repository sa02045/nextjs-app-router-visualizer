# nextjs-app-router-visualizer

**Visualize** your Next.js App Router page navigation flow as Mermaid flowcharts.

## What is this?

**nextjs-app-router-visualizer** analyzes your Next.js App Router source code and generates a visual graph of page navigation flow. It statically analyzes AST to detect all navigation patterns and renders them as a Mermaid flowchart.

## Usage

In your Next.js App Router project root:

```console
npx nextjs-app-router-visualizer
```

Or specify an entry file:

```console
npx nextjs-app-router-visualizer --entry app/page.tsx
npx nextjs-app-router-visualizer --entry src/app/page.tsx
```

### Options

| Option | Description |
|--------|-------------|
| `--entry <path>` | Entry page file path (auto-detected if omitted) |
| `--format <type>` | Output format: `html` (default) or `json` |

### Example

See the [example app](https://github.com/sa02045/nextjs-app-router-visualizer/tree/main/example/app) for a complete demo covering all supported navigation patterns.

## Supported Navigation Patterns

| Pattern | Example | Detected |
|---------|---------|----------|
| `<Link href>` | `<Link href="/about">About</Link>` | O |
| `<Link replace>` | `<Link href="/login" replace>Login</Link>` | O |
| `router.push()` | `router.push("/products")` | O |
| `router.replace()` | `router.replace("/home")` | O |
| `router.back()` | `router.back()` | O |
| `router.forward()` | `router.forward()` | O |
| `redirect()` | `redirect("/login")` | O |
| `permanentRedirect()` | `permanentRedirect("/new-page")` | O |
| `notFound()` | `notFound()` | O |
| `history.pushState()` | `history.pushState(null, "", "/page")` | O |
| `history.replaceState()` | `history.replaceState(null, "", "/page")` | O |
| Template literals | `` router.push(`/products/${id}`) `` | O |
| Component imports | Navigation in imported components is tracked | O |

### Route Features

| Feature | Supported |
|---------|-----------|
| Dynamic routes (`[id]`, `[...slug]`, `[[...slug]]`) | O |
| Route groups (`(marketing)`, `(auth)`) | O |
| Nested layouts | O |

## How It Works

1. Parses page files using Babel AST
2. Detects navigation calls (Link, useRouter, redirect, etc.)
3. Follows local component imports to track navigation across files
4. Resolves dynamic routes and route groups
5. Generates a Mermaid flowchart or JSON graph

## License

ISC
