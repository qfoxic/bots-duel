'use client'
import React from 'react';

interface SectionProps {
  title: string;
  /** Tailwind color classes like 'bg-blue-500', 'bg-green-400', etc. */
  color: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, color, children }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
      <span className={`w-3 h-3 ${color} rounded-full mr-3`}></span>
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </div>
);
