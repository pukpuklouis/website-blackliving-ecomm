# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.

## Blog Composer — Dynamic Categories (Admin)

- The Blog Composer no longer hardcodes categories or uses a z.enum.
- It loads categories from the API (`GET ${PUBLIC_API_URL}/api/posts/categories`) and stores `categoryId` in the form.
- On submit, it also sends the `category` name to keep backward compatibility with the posts schema.
- If creating a new post, the first active category is selected by default after categories load.
- A small refresh icon button in the category section clears server cache and reloads categories.
- After adding or editing blog categories (via future category CRUD), call the API to invalidate cache:

```bash
curl -X POST -H "Authorization: Bearer <admin-token>" \
  "${PUBLIC_API_URL}/api/posts/categories/cache/invalidate"
```

Files involved:
- Admin UI: `apps/admin/app/components/BlogComposer.tsx`
- API + cache: `apps/api/src/modules/posts.ts`, `apps/api/src/lib/cache.ts`
