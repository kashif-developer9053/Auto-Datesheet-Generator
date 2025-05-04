'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                University Name
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {session.user.name}</span>
              <Link href="/api/auth/signout" className="text-gray-600 hover:text-blue-600">
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">User Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {session.user.name}</p>
                <p><span className="font-medium">Email:</span> {session.user.email}</p>
                <p><span className="font-medium">Role:</span> {session.user.role}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/dashboard/profile" className="block text-blue-600 hover:text-blue-800">
                  View Profile
                </Link>
                <Link href="/dashboard/settings" className="block text-blue-600 hover:text-blue-800">
                  Account Settings
                </Link>
                {session.user.role === 'admin' && (
                  <Link href="/dashboard/admin" className="block text-blue-600 hover:text-blue-800">
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Last login: {new Date().toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">Account created: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 