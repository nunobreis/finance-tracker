export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-between bg-linear-to-b from-ink via-teal via-60% to-teal-dark px-6 pt-4 pb-6 lg:justify-center lg:py-10">
      {children}
    </main>
  )
}
