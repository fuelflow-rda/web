import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Gallery } from './Gallery';

export const metadata: Metadata = { title: 'Design system', robots: { index: false, follow: false } };

/**
 * Every base component and token, in the order of the Pencil "Components"
 * board, for checking the build against the design. Development only.
 */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <Gallery />;
}
