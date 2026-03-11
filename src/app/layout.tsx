'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import './globals.css';

const theme = {
  token: {
    colorPrimary: '#F97316',
    colorLink: '#F97316',
    colorLinkHover: '#EA580C',
    borderRadius: 8,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  components: {
    Button: {
      colorPrimary: '#F97316',
      algorithm: true,
    },
    Menu: {
      colorItemBgSelected: 'rgba(249,115,22,0.1)',
      colorItemTextSelected: '#F97316',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>FuelFlow — Station Management</title>
        <meta name="description" content="FuelFlow fuel station management dashboard" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <ConfigProvider theme={theme}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
