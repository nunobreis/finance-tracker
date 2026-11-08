import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TabBar } from '@/components/layout/TabBar'
import { MobileNavProvider } from '@/components/layout/MobileNavContext'
import { seedCategoriesIfEmpty } from '@/lib/categories'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await seedCategoriesIfEmpty(user.id)

  return (
    <MobileNavProvider>
      <div className="flex h-screen overflow-hidden bg-canvas">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-y-auto bg-canvas pb-[calc(var(--tabbar-h,80px)+24px+env(safe-area-inset-bottom,0px))] lg:pb-8">
          {children}
        </main>
        <TabBar />
      </div>
    </MobileNavProvider>
  )
}
