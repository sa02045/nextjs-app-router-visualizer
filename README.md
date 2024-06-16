# nextjs-app-router-visualizer

**Visualize** your Next.js website Flow

`Current status: experimental`

## What is this?

- **nextjs-app-router-visualizer** is a tool that helps you visualize the flow of your Next.js website.
- It helps you to understand the flow of your website by visualizing the page flow.

## Usage

In your Next.js App router project root

```console
$ npx nextjs-app-router-visualizer

or

$ npx nextjs-app-router-visualizer --entry app/page.tsx
```

- **entry file path**: The path of the entry page file that is the entry point of the page flow to be visualized.

ex.

```console
$ npx nextjs-app-router-visualizer --entry app/page.tsx
$ npx nextjs-app-router-visualizer --entry src/app/page.tsx
$ npx nextjs-app-router-visualizer --entry src/app/folder/page.tsx
```

### Example

- You can see the example app [here](https://github.com/sa02045/nextjs-app-router-visualizer/tree/main/example/app)
- You can see the example visualized page flow <img width="500" alt="스크린샷 2024-06-16 오후 7 41 43" src="https://github.com/sa02045/open-source-contribute/assets/50866506/8e55a612-7d20-476c-a444-e612128fdaba">

## Limitations

This project has many limitations because it is an experimental project.

- Only supports Next.js **App router** projects
- Does not support for redirect function yet
- Does not support for native History API yet
- Does not support for Route Groups yet
- ...etc

This project currently supports the following features.

- Only Top level useRouter router method
- Only Top level Link Component
