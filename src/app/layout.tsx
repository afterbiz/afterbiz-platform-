import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '퇴근후창업',
  description: '퇴근 후, 실행으로 창업을 완성하는 커뮤니티',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-950 text-gray-100">{children}</body>
    </html>
  )
}
