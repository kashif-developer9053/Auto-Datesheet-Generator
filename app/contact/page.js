'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setFormData({ name: '', email: '', message: '' });
  };

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://www.facebook.com',
      logo: '/facebook.png',
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com',
      logo: '/linkedin.png',
    },
    {
      name: 'Twitter',
      url: 'https://www.x.com',
      logo: '/twitter.png',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
     

      {/* Contact Section */}
      <div className="py-16 px-5 max-w-7xl mx-auto text-center">
        <h1 className="font-serif text-5xl text-green-600 mb-8">Contact Us</h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-10">
          Have questions or need assistance? We're here to help! Reach out to us using the form below, or connect with us on social media. Your feedback and inquiries are important to us.
        </p>

        {/* Contact Form */}
        <div className="max-w-lg mx-auto text-left">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 mb-5 border border-gray-300 rounded-md text-base bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 mb-5 border border-gray-300 rounded-md text-base bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
              className="w-full p-3 mb-5 border border-gray-300 rounded-md text-base bg-white text-gray-900 h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-5 py-3 rounded-md hover:bg-blue-700 transition-colors w-full md:w-auto"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Social Media Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-10 max-w-3xl mx-auto">
          {socialLinks.map((social) => (
            <Link
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Image
                src={social.logo}
                alt={`${social.name} Logo`}
                width={80}
                height={80}
                className="mb-2 rounded-full"
              />
              <span className="text-blue-600 font-medium text-lg">{social.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}