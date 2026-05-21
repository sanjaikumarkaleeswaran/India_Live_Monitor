# India Live Monitor — Frontend (Next.js)

This is the Next.js frontend application for the **India Live Monitor** platform. It has been migrated from Vite.js to the modern Next.js 15 App Router architecture for improved performance, SEO capabilities, and scalability.

## Technologies Used
- **Framework**: Next.js 15 (App Router)
- **State Management**: Redux Toolkit (auth, UI states)
- **Data Fetching**: TanStack React Query (cached server sync)
- **Styling**: Tailwind CSS v4 (configured via PostCSS)
- **Icons**: Lucide React
- **Maps**: Leaflet / React-Leaflet (loaded client-side dynamically to prevent SSR hydration errors)

## Getting Started

### Prerequisites
Make sure you have Node.js installed (v18+ recommended).

### Installation
From the `frontend` directory, install all required dependencies:
```bash
npm install --legacy-peer-deps
```

### Environment Variables
Configure your environment variables in `.env`. Key variables:
- `NEXT_PUBLIC_API_BASE_URL`: Base URL for the backend API (defaults to `/api` proxy in development).

### Run in Development
Start the Next.js local dev server:
```bash
npm run dev
```
The application will run on [http://localhost:3000](http://localhost:3000).

### Build for Production
To build the application:
```bash
npm run build
```
This performs a production compile, optimizes static/dynamic pages, and validates all typescript/lint constraints.
