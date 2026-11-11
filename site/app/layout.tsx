import type { Metadata, Viewport } from "next"

import "@fontsource-variable/inter/opsz.css"
import "@fontsource-variable/jetbrains-mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "Upkeep",
  description:
    "When a library your app uses changes, Upkeep automatically opens a pull request that fixes your code, and only if your own tests still pass.",
}

export const viewport: Viewport = { themeColor: "#0c1116" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
