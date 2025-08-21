'use client'
import React, { useContext } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from 'next/image'
import { LayoutDashboard, Users, BookOpen, ClipboardCheck, UserCircle2Icon, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserDetailContext } from '@/context/UserDetailContext'

// Definisikan menu baru untuk setiap peran
const menuConfig = {
  admin: [
    { title: 'Users', icon: Shield, path: '/workspace/admin' },
    { title: 'Dashboard', icon: LayoutDashboard, path: '/workspace' },
    { title: 'Kelas', icon: Users, path: '/workspace/kelas' },
    { title: 'Materi', icon: BookOpen, path: '/workspace/materi' },
    { title: 'Tugas/Kuis', icon: ClipboardCheck, path: '/workspace/task' },
    { title: 'Profile', icon: UserCircle2Icon, path: '/workspace/profile' }
  ],
  guru: [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/workspace' },
    { title: 'Kelas', icon: Users, path: '/workspace/kelas' },
    { title: 'Materi', icon: BookOpen, path: '/workspace/materi' },
    { title: 'Tugas/Kuis', icon: ClipboardCheck, path: '/workspace/task' },
    { title: 'Profile', icon: UserCircle2Icon, path: '/workspace/profile' }
  ],
  siswa: [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/workspace' },
    { title: 'Kelas', icon: Users, path: '/workspace/kelas' },
    { title: 'Materi', icon: BookOpen, path: '/workspace/materi' },
    { title: 'Tugas/Kuis', icon: ClipboardCheck, path: '/workspace/task' },
    { title: 'Profile', icon: UserCircle2Icon, path: '/workspace/profile' }
  ]
};

function AppSidebar() {
  const path = usePathname();
  const { userDetail } = useContext(UserDetailContext);
  const userRole = userDetail?.role || 'siswa';
  const sideBarOptions = menuConfig[userRole];

  return (
    <Sidebar>
      <SidebarHeader className={'p-2'}>
        <Image src={'/logosma2.png'} alt='logo' width={300} height={200} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="p-2">
          {sideBarOptions.map((item, index) => {
            const isActive = path.startsWith(item.path) && (item.path !== '/workspace' || path === '/workspace');

            return (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton asChild className={'p-5'}>
                <Link href={item.path} className={`text-[17px] ${isActive && 'text-primary bg-blue-50'}`}>
                  <item.icon className='h-7 w-7' />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
      })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar;