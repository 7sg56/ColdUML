# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Next.js 15 project called "colduml" built with TypeScript, Tailwind CSS 4, and modern React 19. The project uses the new App Router architecture with Turbopack for fast development builds.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack (opens at http://localhost:3000)
- `npm run build` - Build for production with Turbopack optimization
- `npm start` - Start production server (requires build first)
- `npm run lint` - Run ESLint with Next.js and TypeScript configurations

### Package Management
- `npm install` - Install all dependencies
- `npm install <package>` - Add new dependency
- `npm install <package> --save-dev` - Add new dev dependency

## Architecture

### Project Structure
- **`/app`** - Next.js 15 App Router directory containing pages, layouts, and route handlers
  - `layout.tsx` - Root layout with Geist fonts and global styling
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind CSS 4 and custom CSS variables
- **`/public`** - Static assets (images, icons)
- **Configuration files at root** - TypeScript, ESLint, PostCSS, and Next.js configs

### Technology Stack
- **Next.js 15.5.5** with App Router and Turbopack
- **React 19.1.0** with modern concurrent features
- **TypeScript 5** with strict configuration
- **Tailwind CSS 4** with PostCSS integration and inline theme configuration
- **ESLint 9** with Next.js and TypeScript rules

### Key Configuration Details
- **TypeScript**: Strict mode enabled, ES2017 target, path aliases with `@/*` pointing to root
- **Tailwind**: CSS 4 with custom CSS variables for theming, dark mode support
- **Fonts**: Geist Sans and Geist Mono from Google Fonts with CSS variables
- **ESLint**: Flat config format with Next.js core web vitals and TypeScript rules

### Development Patterns
- Uses App Router file-based routing (`app/` directory)
- Server Components by default (use 'use client' directive when needed)
- CSS variables for consistent theming with automatic dark mode detection
- TypeScript strict mode with comprehensive type checking
- Font optimization through Next.js font system with CSS variables

## File Locations

### Main Application Files
- Entry point: `app/page.tsx`
- Root layout: `app/layout.tsx`
- Global styles: `app/globals.css`

### Configuration Files
- TypeScript: `tsconfig.json`
- Next.js: `next.config.ts`
- ESLint: `eslint.config.mjs`
- PostCSS: `postcss.config.mjs`
- Dependencies: `package.json`

## Development Notes

- The project uses Turbopack for both development and build processes for improved performance
- Tailwind CSS 4 uses a new inline theme configuration in `globals.css`
- The app implements automatic dark/light mode switching based on user preference
- All TypeScript paths use the `@/*` alias pattern pointing to the root directory
- ESLint is configured with the modern flat config format and includes Next.js specific rules