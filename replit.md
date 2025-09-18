# Overview

Foldera is an AI-powered legal compliance and document management platform designed to prevent disasters and protect careers. The application provides three pricing tiers with integrated Stripe payment processing for subscription management. It features real-time document scanning, conflict detection, and automated fixing capabilities with a dark-themed, modern user interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a hybrid Next.js/React architecture with both App Router (Next.js) and client-side routing (Wouter). The frontend is built with:
- **React 18** with TypeScript for type safety
- **Vite** as the build tool for fast development
- **Tailwind CSS** with custom dark theme variables
- **Radix UI** components for accessible, headless UI primitives
- **shadcn/ui** component system for consistent design
- **Tanstack React Query** for server state management

## Backend Architecture
The backend follows a Node.js Express pattern with:
- **Express.js** server with TypeScript
- **RESTful API** design with JSON responses
- **Drizzle ORM** for database operations with PostgreSQL dialect
- **Memory storage** implementation for development with interface for database migration
- **Middleware-based** request/response logging and error handling

## Data Storage
The application uses:
- **PostgreSQL** as the primary database (configured via Drizzle)
- **Neon Database** serverless PostgreSQL for cloud deployment
- **Schema-driven** approach with Zod validation
- **Database tables** for users, demo requests, matter metrics, violations, and filings
- **Stripe integration** fields for customer and subscription management

## Payment Processing
Integrated Stripe payment system supporting:
- **Three pricing tiers**: Self-Serve ($99/month), Pro ($399/month), Pilot ($5,000 one-time)
- **Unified payment endpoint** handling both subscriptions and one-time payments
- **Customer management** with automatic creation and retrieval
- **Environment-based** price ID configuration with fallback defaults

## Authentication & Security
- **Session-based** authentication preparation (connect-pg-simple for PostgreSQL sessions)
- **CORS and security** middleware setup
- **Environment variable** management for sensitive data
- **Stripe webhook** ready architecture for payment event handling

## UI/UX Design System
- **Dark theme** as primary design with purple accent colors
- **Responsive design** with mobile-first approach
- **Component library** built on Radix UI primitives
- **Form handling** with React Hook Form and Zod validation
- **Toast notifications** for user feedback
- **Animated components** with custom CSS animations and visual effects

# External Dependencies

## Payment Processing
- **Stripe** - Complete payment infrastructure with React Stripe.js integration
- **Environment variables**: STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY, optional custom price IDs

## Database & ORM
- **Neon Database** - Serverless PostgreSQL hosting
- **Drizzle ORM** - Type-safe database operations with PostgreSQL dialect
- **Environment variables**: DATABASE_URL

## UI Framework & Styling
- **Radix UI** - Accessible headless component primitives
- **Tailwind CSS** - Utility-first CSS framework with custom design tokens
- **Lucide React** - Icon library for consistent iconography
- **Inter font** - Typography via Google Fonts

## Development & Build Tools
- **Vite** - Fast build tool with HMR and development plugins
- **esbuild** - Fast JavaScript bundler for production builds
- **TypeScript** - Type safety across frontend and backend
- **Replit plugins** - Development environment integration for error handling and debugging

## Form & Data Management
- **React Hook Form** - Performant form library with validation
- **Zod** - Schema validation for forms and API endpoints
- **date-fns** - Date manipulation utilities
- **Tanstack React Query** - Server state management and caching