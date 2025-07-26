'use client'
import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Book, Compass, LayoutDashboard, PencilRulerIcon, UserCircle2Icon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AddNewCourseDialog from './AddNewCourseDialog'

const SideBarOptions=[
  {
    title:'Dashboard',
    icon:LayoutDashboard,
    path:'/workspace'
  },
  {
    title:'My Learning',
    icon:Book,
    path:'/workspace/my-learning'
  },
  {
    title:'Explore Courses',
    icon:Compass,
    path:'/workspace/explore'
  },
  {
    title:'AI Tools',
    icon:PencilRulerIcon,
    path:'/workspace/ai-tools'
  },
  {
    title:'Profile',
    icon:UserCircle2Icon,
    path:'/workspace/profile'
  }

]

function AppSidebar() {

  const path=usePathname();

  return (
    <Sidebar>
      <SidebarHeader className={'p-2'}>
        <Image src={'/logosma2.png'} alt='logo' width={300} height={200} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup >
          <AddNewCourseDialog>
          <Button>Create New Course</Button>
          </AddNewCourseDialog>
          </SidebarGroup>
          <SidebarGroup >
              <SidebarGroupContent>
                <SidebarMenu>
                  {SideBarOptions.map((item,index)=>(
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton asChild className={'p-5'}>
                        <Link href={item.path} className={`text-[17px]
                          ${path.includes(item.path)&&'text-primary bg-blue-50'}`}>
                          <item.icon className='h-7 w-7'/>
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
              </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}

export default AppSidebar