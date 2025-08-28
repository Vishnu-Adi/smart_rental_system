import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Providers from "./providers"
import { AuthProvider } from "@/contexts/AuthContext"
import AdminLayout from "@/components/AdminLayout"
import AppRouter from "@/components/AppRouter"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Smart Rental Tracking System",
  description: "Fleet, health, usage, forecast, and customers dashboards",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <AuthProvider>
          <Providers>
            <AppRouter>
              <AdminLayout>{children}</AdminLayout>
            </AppRouter>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}
