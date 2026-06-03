import Providers from './providers'
import '../index.css'
import 'leaflet/dist/leaflet.css'

export const metadata = {
  title: 'Smart India Live Monitor',
  description: 'Smart India Live Monitor — Real-time fuel prices, weather, AQI, emergency alerts, safety zones, and disaster tracking for Indian citizens.',
  keywords: 'India live monitor, fuel prices India, AQI India, weather alerts, emergency India, safety monitor, disaster tracking India',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Smart India Live Monitor',
    description: "India's unified real-time civic intelligence platform",
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smart India Live Monitor',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: '#0f172a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
