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
import { Button } from '@/components/ui/button'
import { Book, Compass, LayoutDashboard, UserCircle2Icon, ClipboardCheck, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AddNewCourseDialog from './AddNewCourseDialog'
import { UserDetailContext } from '@/context/UserDetailContext'

// Definisikan menu untuk setiap peran
const menuConfig = {
  admin: [
    { title: 'Admin Panel', icon: Shield, path: '/workspace/admin' },
    { title: 'Dashboard', icon: LayoutDashboard, path: '/workspace' },
    { title: 'Explore Courses', icon: Compass, path: '/workspace/explore' },
    { title: 'Task', icon: ClipboardCheck, path: '/workspace/task' },
    { title: 'Profile', icon: UserCircle2Icon, path: '/workspace/profile' }
  ],
  guru: [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/workspace' },
    { title: 'My Learning', icon: Book, path: '/workspace/my-learning' },
    { title: 'Explore Courses', icon: Compass, path: '/workspace/explore' },
    { title: 'Task', icon: ClipboardCheck, path: '/workspace/task' },
    { title: 'Profile', icon: UserCircle2Icon, path: '/workspace/profile' }
  ],
  siswa: [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/workspace' },
    { title: 'My Learning', icon: Book, path: '/workspace/my-learning' },
    { title: 'Explore Courses', icon: Compass, path: '/workspace/explore' },
    { title: 'Task', icon: ClipboardCheck, path: '/workspace/task' },
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
        {userRole === 'guru' && (
          <div className="p-2">
            <AddNewCourseDialog>
              <Button className="w-full">Create New Course</Button>
            </AddNewCourseDialog>
          </div>
        )}
        
        <SidebarMenu className="p-2">
          {sideBarOptions.map((item, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton asChild className={'p-5'}>
                <Link href={item.path} className={`text-[17px] ${path.includes(item.path) && 'text-primary bg-blue-50'}`}>
                  <item.icon className='h-7 w-7' />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar;