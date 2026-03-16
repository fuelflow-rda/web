'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import './globals.css';

const theme = {
  token: {
    colorPrimary: '#F97316',
    colorLink: '#F97316',
    colorLinkHover: '#EA580C',
    borderRadius: 10,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    colorBgContainer: '#ffffff',
    colorBorderSecondary: '#F1F5F9',
  },
  components: {
    Button: {
      colorPrimary: '#F97316',
      algorithm: true,
      controlHeight: 40,
      borderRadius: 10,
    },
    Menu: {
      colorItemBgSelected: 'rgba(249,115,22,0.1)',
      colorItemTextSelected: '#F97316',
    },
    Card: {
      borderRadiusLG: 16,
    },
    Table: {
      borderRadius: 12,
      headerBg: '#F8FAFC',
    },
    Select: {
      borderRadius: 10,
    },
    Input: {
      borderRadius: 10,
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen w-full m-0 p-0 overflow-x-hidden" style={{ background: '#F8FAFC' }}>
        <ConfigProvider theme={theme}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
