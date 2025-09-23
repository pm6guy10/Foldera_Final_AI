import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Foldera - Stop Babysitting Your AI',
  description: 'Foldera remembers, detects, and fixes costly mistakes while you sleep.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @keyframes unstable-text {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px) rotate(-0.5deg); }
            75% { transform: translateX(2px) rotate(0.5deg); }
          }
          
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          
          @keyframes slide-in-right {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          .animate-fade-in { animation: fade-in 0.3s ease-out; }
          .animate-scale-in { animation: scale-in 0.3s ease-out; }
          .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        `}</style>
      </head>
      <body className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}