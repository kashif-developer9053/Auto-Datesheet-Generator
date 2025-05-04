'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function About() {
  const [showMore, setShowMore] = useState(false);

  const toggleText = () => {
    setShowMore(!showMore);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar */}
     

 

      {/* About Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-serif text-5xl text-green-700 mb-8">About Online Date Sheet Generator</h1>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Welcome to the Online Date Sheet Generator, your ultimate solution for creating and managing academic schedules with ease.
          Our platform is designed to simplify the process of generating date sheets for IIUI, ensuring that students and faculty can
          focus on what truly matters – learning and teaching.
        </p>
        <p className="text-lg text-gray-700 leading-relaxed mb-10">
          With our intuitive interface, you can effortlessly input exam dates, subjects, and time slots to create customized date sheets
          tailored to your academic calendar. Whether you're a student, administrative staff, or faculty member, our tool is here to enhance
          efficiency, reduce scheduling conflicts, and bring clarity to your academic planning.
        </p>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
  {["about 1.png", "about 4.png", "about 3.png"].map((src, index) => (
    <div key={src} className="relative w-full h-140 rounded-lg overflow-hidden shadow-md">
      <Image
        src={`/${src}`}
        alt={`Campus Image ${index + 1}`}
        fill
        className="object-cover hover:scale-105 transition-transform duration-300"
      />
    </div>
  ))}
</div>

      </main>

      {/* Footer */}
      
    </div>
  );
}
