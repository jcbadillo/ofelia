import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist. Your journal entries are safe.</p>
      <Link href="/">Go to today</Link>
    </main>
  );
}
