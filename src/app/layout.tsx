import "./globals.css"

export const metadata = {
  title: "Tabletop 3D",
  description: "Editor e apresentador de cenários 3D para mestres de RPG",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
