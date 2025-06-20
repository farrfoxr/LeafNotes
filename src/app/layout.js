// © 2025 Farrell Laurensius Suryadi. All rights reserved.
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-monkeytype",
  display: "swap",
})

export const metadata = {
  title: "Leaf Notes",
  description: "AI-powered chatbot interface",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-monkeytype antialiased`}>{children}</body>
    </html>
  )
}
