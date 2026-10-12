import Link from 'next/link';

export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <Link href="/">Go to today</Link>
    </main>
  );
}
