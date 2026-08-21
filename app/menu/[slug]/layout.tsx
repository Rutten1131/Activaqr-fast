import React from 'react';

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#001549] text-white font-sans antialiased">
      {children}
    </div>
  );
}
