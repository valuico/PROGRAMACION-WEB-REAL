import './globals.css'

export const metadata = {
  title: 'HAZE Beauty | Official Site',
  description: 'Productos de belleza de alta gama con enfoque en skincare y makeup minimalista',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
