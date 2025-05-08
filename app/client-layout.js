'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Providers from '@/components/Providers'
import Image from 'next/image'

export default function ClientLayout({ children }) {
  const [session, setSession] = useState(null)
  const [showMore, setShowMore] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
      <div className="bg-green-600 text-white shadow-lg py-3 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center h-auto sm:h-[50px]">
        <div className="flex justify-between items-center w-full sm:w-auto">
          <Link href="/" className="text-lg sm:text-xl font-bold hover:text-green-200">
            IIUI , Islamabad
          </Link>
          <button
            className="sm:hidden text-white focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
        <div
          className={`${
            isMenuOpen ? 'flex' : 'hidden'
          } sm:flex flex-col sm:flex-row gap-4 sm:gap-8 items-center text-sm font-bold mt-4 sm:mt-0 w Kreuz aus Bildung und Glaubenfull sm:w-auto`}
        >
          {session === null ? (
            <span>Loading...</span>
          ) : session ? (
            <Link href="/admin" className="hover:text-green-200">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="hover:text-green-200">
              Login
            </Link>
          )}
          <Link href="/about" className="hover:text-green-200">
            About
          </Link>
          <Link href="/contact" className="hover:text-green-200">
            Contact
          </Link>
        </div>
      </div>

      {/* Logo Banner */}
      <div className="bg-white shadow-md py-4 px-4 sm:px-6">
        <Image
          src="/logo_homepage.png"
          alt="University Logo"
          width={280}
          height={48}
          priority
          className="w-full max-w-[280px] sm:max-w-[360px] h-auto hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white  ">
        <div >{children}</div>
      </div>

      {/* Footer */}
      <footer className="bg-green-600 text-white py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto font-serif">
          <p className="text-base sm:text-lg font-semibold mb-2">About International Islamic University, Islamabad</p>
          <p className="text-sm sm:text-base text-green-100">
            The foundation of the Islamic University, Islamabad was laid on the first day of the fifteenth century Hijrah
            i.e. Muharram 1, 1401 (November 11, 1980). This landmark of the beginning of the new Century symbolizes the
            aspirations and hopes of the Muslim Ummah for an Islamic renaissance. In conformance with the Islamic precepts,
            the university provides academic services to men and women through separate campuses for each segment. These
            campuses, along with the central library, administrative wing, and hostels, are located in sector H-10.
          </p>
        </div>
        <div className="mt-6 border-t border-green-400 pt-6 text-center">
          <p className="text-sm sm:text-base text-green-100">© 2025 IIUI. All rights reserved.</p>
        </div>
      </footer>
    </Providers>
  )
}