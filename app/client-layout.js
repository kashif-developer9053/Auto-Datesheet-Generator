'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import  Providers  from '@/components/Providers'
import Image from 'next/image'

export default function ClientLayout({ children }) {
  const [session, setSession] = useState(null)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        setSession(!!data.user)
      } catch (err) {
        setSession(false)
      }
    }
    fetchSession()
  }, [])

  return (
    <Providers>
      {/* Navbar */}
      <div className="bg-green-600 text-white shadow-lg py-3 px-6 flex justify-between items-center h-[50px]">
        <Link href="/" className="text-xl font-bold hover:text-green-200">
          International Islamic University, Islamabad
        </Link>
        <div className="flex gap-8 items-center text-sm font-bold">
          {session === null ? (
            <span>Loading...</span>
          ) : session ? (
            <Link href="/admin" className="hover:text-green-200">Dashboard</Link>
          ) : (
            <Link href="/login" className="hover:text-green-200">Login</Link>
          )}
          <Link href="/about" className="hover:text-green-200">About</Link>
          <Link href="/contact" className="hover:text-green-200">Contact</Link>
        </div>
      </div>
 {/* Logo Banner */}
 <div className="bg-white shadow-md py-4 px-6 text-center">
        <Image
          src="/logo_homepage.png"
          alt="University Logo"
          width={360}
          height={60}
          priority
          className="hover:scale-110 transition-transform duration-300"
        />
      </div>
      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-green-600 text-white  py-5 px-5">
        <div className="max-w-[950px] mx-auto font-serif">
          <p className="text-lg font-semibold">About University Name</p>
          <p className="text-base text-green-100 inline">
            University Name is dedicated to empowering students with knowledge and innovation for a better tomorrow.
            Our institution offers state-of-the-art facilities and a diverse range of programs for academic excellence and personal growth.

          </p>
          
        </div>
        <div className="mt-8 border-t border-green-400 pt-8 text-center">
          <p className="text-green-100">© 2025 University Name. All rights reserved.</p>
        </div>
      </footer>

    
    </Providers>
  )
}
