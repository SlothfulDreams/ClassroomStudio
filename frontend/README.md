# ClassroomStudio Frontend

This is the frontend for ClassroomStudio, an AI-powered Google Classroom clone built with Next.js and modern web technologies.

## Design System

This project uses [shadcn/ui](https://ui.shadcn.com/) components styled with a **Neobrutalism** design approach inspired by [neobrutalism.dev](https://www.neobrutalism.dev/).

### Key Design Elements
- **Component Library**: shadcn/ui for consistent, accessible components
- **Styling**: Tailwind CSS with neobrutalism patterns
- **Theme**: Educational aesthetic with bold borders, hard shadows, and vibrant colors
- **Visual Style**: Bold, flat design reminiscent of school supplies and classroom materials

### Neobrutalism Patterns Used
- Bold black borders (`border-4 border-black`)
- Hard drop shadows (`shadow-[4px_4px_0px_0px_#000000]`)
- Bright, contrasting colors (yellow, red, cyan, pink backgrounds)
- Asymmetric layouts with intentional "imperfection"
- Typography mixing bold headers with readable body text

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Component Architecture

### shadcn/ui Components
The project is built using shadcn/ui components that are:
- Pre-configured with neobrutalism styling
- Accessible by default
- Customizable via Tailwind CSS
- Located in `src/components/ui/` (when added)

### Adding New Components
To add shadcn/ui components:
```bash
npx shadcn@latest add [component-name]
```

Components will be automatically styled to match the neobrutalism theme defined in `tailwind.config.ts` and `components.json`.

### Custom Styling
All components follow the educational neobrutalism theme:
- Classroom elements: Chalkboard/whiteboard aesthetics
- Assignments: Notebook paper styling with lines
- Submissions: Folder/binder visual metaphors
- Analytics: Colorful charts like educational posters
- Interactive elements: School supply inspired (crayons, markers, pins)

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Components**: shadcn/ui with neobrutalism styling
- **Styling**: Tailwind CSS 4
- **Database**: Convex (real-time sync)
- **Authentication**: Convex Auth
- **Icons**: Lucide React

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
