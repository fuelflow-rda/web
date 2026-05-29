'use client';

import React from 'react';
import { ConfigProvider } from 'antd';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthBootstrap } from '@/components/AuthBootstrap';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const theme = {
  token: {
    colorPrimary: '#F97316',
    colorLink: '#F97316',
    colorLinkHover: '#EA580C',
    borderRadius: 10,
    fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
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
    <html lang="en" className={inter.variable}>
      <head>
        <title>StationIQ</title>
        <meta name="description" content="StationIQ fuel station management dashboard" />
      </head>
      <body className={`${inter.className} min-h-screen w-full m-0 p-0 overflow-x-hidden`} style={{ background: '#F8FAFC' }}>
        <ConfigProvider theme={theme}>
          <AuthBootstrap />
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
