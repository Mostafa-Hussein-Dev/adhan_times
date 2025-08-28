# Overview

This is a Progressive Web App (PWA) for Islamic prayer times with notifications and audio Adhan playback. The application scrapes prayer times from almanar.com.lb for Beirut, Lebanon, displays them in a modern mobile-first interface, and allows users to configure notifications for each prayer time. The app supports offline functionality through service workers and provides audio Adhan playback when prayer times arrive.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React SPA**: Built with Vite as the build tool and TypeScript for type safety
- **UI Framework**: Uses shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Responsive design optimized for mobile devices with a phone container layout

## Backend Architecture
- **Express.js Server**: RESTful API server with middleware for logging and error handling
- **Data Storage**: Dual storage approach with in-memory storage (MemStorage) and PostgreSQL support via Drizzle ORM
- **Web Scraping**: Custom scraper service using Axios and Cheerio to extract prayer times from almanar.com.lb
- **Development Setup**: Vite integration for hot module replacement in development mode

## Data Schema
- **Prayer Times Table**: Stores daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) with date, location, and scraping timestamp
- **Notification Settings Table**: User preferences for prayer notifications including enabled prayers, auto-play settings, and volume control

## PWA Features
- **Service Worker**: Caches resources for offline functionality
- **Web App Manifest**: Enables installation on mobile devices as a native app
- **Notification API**: Browser notifications for prayer times with user permission handling
- **Audio Playback**: Adhan audio file playback with volume control

## Key Design Patterns
- **Repository Pattern**: IStorage interface abstracts data access with multiple implementations
- **Singleton Pattern**: Audio service and notification service use singleton instances
- **Hook-based Architecture**: Custom React hooks for prayer times, notifications, and audio management
- **Type Safety**: Shared TypeScript types between frontend and backend via shared schema

# External Dependencies

## Core Frameworks
- **React 18**: Frontend framework with TypeScript support
- **Express.js**: Backend web server framework
- **Vite**: Build tool and development server
- **Drizzle ORM**: Type-safe database ORM for PostgreSQL

## UI and Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Data and API
- **TanStack Query**: Server state management and caching
- **Axios**: HTTP client for API requests and web scraping
- **Cheerio**: Server-side HTML parsing for web scraping
- **Zod**: Schema validation library

## Database
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **PostgreSQL**: Primary database (configured via Drizzle)

## Development Tools
- **TypeScript**: Static type checking
- **ESBuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

## Replit Integration
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling integration