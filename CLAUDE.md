# CLAUDE.md
Be extremely concise. Sacrifice grammar for the sake of concision.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClassroomStudio is an AI-powered Google Classroom clone with intelligent assignment grading and weakness pattern analysis. Built with Next.js 15 (App Router), Convex (backend-as-a-service), and styled with a Neobrutalism design system.

**Key Features:**
- Classroom management with role-based access (instructor, TA, student)
- AI-powered submission analysis with weakness detection
- Real-time collaboration via Convex
- File upload/download with Convex storage
- Aggregated analytics showing common student weaknesses

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
pnpm dev              # Start dev server with Turbopack
pnpm build            # Production build with Turbopack
pnpm start            # Run production server
pnpm lint             # Run Biome linter
pnpm format           # Format code with Biome
```

### Type Checking
```bash
cd frontend
pnpm exec tsc --noEmit   # Type check without emitting files
```

### Convex Backend
```bash
cd frontend
npx convex dev           # Run Convex in dev mode (auto-syncs schema/functions)
npx convex deploy        # Deploy to production
npx convex dashboard     # Open Convex dashboard
npx convex import        # Import sample data
```

## Architecture

### Tech Stack
- **Frontend**: Next.js 15.5 (App Router), React 19, TypeScript 5
- **Backend**: Convex (serverless backend with real-time sync)
- **Auth**: Convex Auth (@convex-dev/auth)
- **Styling**: Tailwind CSS 4, Neobrutalism design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Linting**: Biome (replaces ESLint/Prettier)

### Project Structure
```
ClassroomStudio/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── classrooms/[id]/    # Dynamic classroom routes
│   │   │   │   ├── stream/         # Announcements feed
│   │   │   │   ├── classwork/      # Assignments list
│   │   │   │   ├── people/         # Members management
│   │   │   │   ├── grades/         # Gradebook
│   │   │   │   └── assignments/[assignmentId]/
│   │   │   └── layout.tsx          # Root layout with Convex providers
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   └── classroom/          # Domain-specific components
│   │   └── lib/
│   ├── convex/                     # Convex backend
│   │   ├── schema.ts               # Database schema (single source of truth)
│   │   ├── auth.ts                 # Authentication logic
│   │   ├── classrooms.ts           # Classroom queries/mutations
│   │   ├── assignments.ts          # Assignment operations
│   │   ├── submissions.ts          # Student submissions
│   │   ├── files.ts                # File storage operations
│   │   ├── members.ts              # Membership management
│   │   ├── announcements.ts        # Classroom announcements
│   │   └── permissions.ts          # Role-based access control
│   └── public/
└── backend/                        # Python backend (future AI processing)
```

### Convex Backend Architecture

**Key Concepts:**
- **Reactive Queries**: All data queries automatically re-run when underlying data changes
- **Mutations**: Write operations that are transactional and atomic
- **Actions**: For external API calls (AI services, file processing)
- **HTTP Routes**: REST endpoints in `http.ts`

**Database Schema** (defined in `convex/schema.ts`):
- `users` - User accounts (managed by Convex Auth)
- `classrooms` - Classroom entities with join codes
- `classroomMembers` - Junction table (many-to-many: users ↔ classrooms)
- `assignments` - Assignment definitions with rubrics
- `submissions` - Student submission files and metadata
- `aiAnalyses` - AI-generated feedback on submissions
- `weaknessPatterns` - Aggregated analytics across classroom
- `announcements` - Classroom posts/announcements
- `announcementComments` - Threaded comments
- `fileMetadata` - File storage metadata (links to Convex `_storage`)

**Important Patterns:**
1. **Permission Checks**: Always use `permissions.ts` helpers to verify user access
2. **Denormalization**: `classroomId` is denormalized in many tables for efficient queries
3. **File Storage**: Files go to Convex storage, metadata in `fileMetadata` table
4. **Role Hierarchy**: `instructor` > `ta` > `student`

### Frontend Architecture

**Next.js App Router:**
- Uses React Server Components by default
- Client components marked with `"use client"`
- Dynamic routes: `[id]` and `[assignmentId]` folders
- Layouts wrap nested routes (see `classrooms/[id]/layout.tsx`)

**Data Fetching Pattern:**
```tsx
// In client components
const data = useQuery(api.moduleName.functionName, { args });
const mutation = useMutation(api.moduleName.functionName);

// Conditional queries (skip until data ready)
const data = useQuery(
  api.module.fn,
  condition ? { args } : "skip"
);
```

**Component Organization:**
- `components/ui/` - Reusable UI primitives (Button, Dialog, Card, etc.)
- `components/classroom/` - Domain components (AssignmentCard, MembersList, etc.)
- Components follow controlled/uncontrolled patterns from shadcn/ui

### Design System (Neobrutalism)

**Core Design Tokens** (see `globals.css`):
- **Colors**: Uses OKLCH color space for perceptual uniformity
  - `--main`: Teal/cyan primary color (77.54% lightness)
  - `--background`: Light background (95.31% lightness)
  - `--secondary-background`: White
  - `--border`: Pure black for bold borders
- **Shadows**: Hard shadows with no blur
  - `--shadow: 4px 4px 0px 0px var(--border)`
- **Borders**: Always 2px solid black (`border-2 border-border`)
- **Border Radius**: Consistent 5px (`rounded-base`)
- **Button States**: Translate shadow on hover (moves element)

**Button Variants** (in `components/ui/button.tsx`):
- `default`: Main color with shadow, translates on hover
- `noShadow`: Main color without shadow
- `neutral`: Secondary background with shadow
- `reverse`: Shadow appears on hover (opposite effect)
- ⚠️ **Do NOT use** `outline` or `ghost` - these are not valid variants

**Typography:**
- Headings: `font-heading` (700 weight)
- Body: `font-base` (500 weight)
- All text: `text-foreground` (black in light mode)

### Authentication Flow

1. Convex Auth handles OAuth and email/password
2. User session stored in Convex Auth tables
3. `ConvexAuthNextjsServerProvider` wraps app in `layout.tsx`
4. `useConvexAuth()` hook provides auth state in client components
5. `AuthNavbarWrapper` conditionally shows nav based on auth state

## Common Patterns & Gotchas

### TypeScript Types
- **Convex IDs**: Use `Id<"tableName">` from `convex/_generated/dataModel`
- **API Imports**: `import { api } from "@/../convex/_generated/api"`
- **Always check for null**: Convex queries can return `null` or arrays with `null` items
- **Type Guards**: Use `filter((x): x is NonNullable<typeof x> => x !== null)` to narrow types

### File Operations
- **Upload Flow**:
  1. Use `FileUpload` component
  2. Generates upload URL via `files.generateUploadUrl` mutation
  3. Upload to Convex storage
  4. Create `fileMetadata` record via `files.saveFileMetadata` mutation
- **Download Flow**:
  1. Query `files.getFileUrl` with `fileMetadataId`
  2. Returns temporary signed URL
  3. Use `FileDisplay` component to show file info

### Modal Overlays
- Always use `bg-overlay` class (defined in globals.css)
- **Never use** `bg-black` or `bg-black/50` - breaks theming

### Common Issues
1. **Null handling**: Filter null values before passing arrays to components that expect non-nullable types
2. **Date handling**: Convex stores dates as Unix timestamps (numbers). Use `date-fns` for formatting
3. **Assignment due dates**: Can be `undefined` - always check `hasValidDueDate` before using with `new Date()`
4. **Member types**: API returns `user.name` as `string | undefined`, but components expect `string` - use type assertions when necessary

## Key Files to Reference

- `convex/schema.ts` - Complete database schema with all tables and indexes
- `frontend/src/app/globals.css` - Design system tokens and theme variables
- `frontend/src/components/ui/button.tsx` - Valid button variants
- `convex/permissions.ts` - Role-based access control helpers
- `frontend/src/app/layout.tsx` - Root layout with providers

## Package Management

This project uses **pnpm** (not npm or yarn). Always use:
```bash
pnpm install
pnpm add <package>
pnpm remove <package>
```
