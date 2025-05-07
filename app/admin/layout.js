'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Building,
  DoorOpen,
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const isStudent = session.user.role === 'student';

  const menuItems = isStudent
    ? []
    : [
        { name: 'Dashboard', icon: Calendar, href: '/admin' },
        { name: 'User Management', icon: Users, href: '/admin/users' },
        { name: 'Department Management', icon: Building, href: '/admin/departments' },
        { name: 'Course Management', icon: BookOpen, href: '/admin/courses' },
        { name: 'Batch Management', icon: Calendar, href: '/admin/batches' },
        { name: 'Room Management', icon: DoorOpen, href: '/admin/rooms' },
        { name: 'DateSheet Management', icon: FileText, href: '/admin/datesheets' },
        { name: 'DateSheet Conflict', icon: FileText, href: '/admin/conflict' },
        { name: 'Manual Datesheet', icon: FileText, href: '/admin/manualdatesheet' },


        { name: 'Settings', icon: Settings, href: '/admin/settings' },
      ];

  return (
    <div className="flex flex-1  h-full">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 flex flex-col h-full`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold text-gray-800">
              {isStudent ? session.user.name : 'Admin Panel'}
            </h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center p-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={() => router.push('/api/auth/signout')}
            className="flex items-center w-full p-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}