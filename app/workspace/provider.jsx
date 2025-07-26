import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'
import AppSidebar from './_components/AppSidebar'
import AppHeader from './_components/AppHeader'

function WorkspaceProvider({children}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className='w-full'>
        
        <AppHeader />
        <div className='p-10'>
          {children}
        </div>
        
      </main>
    </SidebarProvider>
  )
}

export default WorkspaceProvider