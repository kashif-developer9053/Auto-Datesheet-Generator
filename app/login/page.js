'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/admin');
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/');
      }
    } catch (error) {
      setError('An error occurred during login');
    }
  };

  if (status === 'loading') {
    return <div className="text-center mt-10 text-lg">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
  

      {/* Main Section: 2 Columns */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] items-center justify-center">
        {/* Left: Login Form */}
        <div className="w-full max-w-md p-8 bg-white border-r border-green-100 shadow-md">
          <h2 className="text-3xl font-bold mb-6 text-green-700 text-center">Sign In</h2>

          {error && (
            <div className="bg-red-100 text-red-700 border border-red-400 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg bg-green-50 focus:ring-2 focus:ring-green-400 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg bg-green-50 focus:ring-2 focus:ring-green-400 text-gray-900"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
            >
              Login
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Dont have an account?
            <Link href="/register" className="text-green-600 hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>

        {/* Right: Info Section */}
        <div className="w-full lg:w-1/2 px-8 py-12 bg-green-50 text-center lg:text-left">
          <h2 className="text-4xl font-extrabold text-green-800 mb-4">
            Auto Date Sheet Generator
          </h2>
          <p className="text-lg text-gray-700 max-w-xl mx-auto lg:mx-0">
            Welcome to the next generation of academic scheduling. Our Auto Date Sheet Generator
            eliminates manual work by automatically creating balanced and conflict-free exam
            schedules for students and faculty.
          </p>
          <ul className="mt-6 text-gray-600 list-disc list-inside max-w-xl mx-auto lg:mx-0 space-y-2">
            <li>Automated exam scheduling</li>
            <li>Student & faculty friendly</li>
            <li>Conflict-free algorithm</li>
            <li>Instant updates and notifications</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
