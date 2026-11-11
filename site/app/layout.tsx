import type { Metadata, Viewport } from "next"

import "@fontsource-variable/mona-sans"
import "@fontsource/dm-mono/400.css"
import "@fontsource/dm-mono/500.css"
import "./globals.css"

export const metadata: Metadata = {
  title: "Upkeep",
  description:
    "When a library your app uses changes, Upkeep automatically opens a pull request that fixes your code, and only if your own tests still pass.",
}

export const viewport: Viewport = { themeColor: "#ffffff" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
