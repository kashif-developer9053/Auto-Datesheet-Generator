'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMore, setShowMore] = useState(false);

  const images = [
    { src: '/frontp2.jpeg', alt: 'Campus 1' },
    { src: '/frontp3.jpg', alt: 'Campus 2' },
    { src: '/frontp4.jpg', alt: 'Campus 3' },
    { src: '/frontp5.jpg', alt: 'Campus 4' },
    { src: '/frontp6.jpg', alt: 'Campus 5' },
  ];

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        setSession(!!data.user);
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setSession(false);
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const toggleText = () => {
    setShowMore(!showMore);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Top Navbar */}
      
   
      {/* Hero Section */}
      <main className="relative">
        <div className="relative h-[700px] overflow-hidden"> {/* increased height */}
          {images.map((image, index) => (
            <Image
              key={image.src}
              src={image.src}
              alt={image.alt}
              className={`absolute inset-0 object-cover transition-opacity duration-1000 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
              fill
              priority={index === 0}
            />
          ))}
          <div className="absolute top-1/2 w-full flex justify-between z-10 px-5">
            <button
              onClick={prevImage}
              aria-label="Previous Image"
              className="bg-black/60 text-white p-4 rounded-full hover:bg-black/80 hover:scale-110 transition-all duration-200"
            >
              ❮
            </button>
            <button
              onClick={nextImage}
              aria-label="Next Image"
              className="bg-black/60 text-white p-4 rounded-full hover:bg-black/80 hover:scale-110 transition-all duration-200"
            >
              ❯
            </button>
          </div>
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 text-white text-4xl font-bold text-center bg-green-600/60 px-4 py-2 rounded-md shadow-md">
            Welcome to
            <p>International Islamic University, Islamabad</p>
          </div>
        </div>

        {/* Removed CTA Button */}

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Academic Excellence',
                desc: 'World-class education and research opportunities for all students.',
              },
              {
                title: 'Innovative Learning',
                desc: 'State-of-the-art facilities and modern teaching methodologies.',
              },
              {
                title: 'Global Community',
                desc: 'Join a diverse community of students and faculty from around the world.',
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl border-l-4 border-green-500 transition-all"
              >
                <h3 className="text-lg font-semibold text-green-700">{title}</h3>
                <p className="mt-2 text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

     
    </div>
  );
}
