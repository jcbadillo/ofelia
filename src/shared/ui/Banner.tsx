import type { ReactNode } from 'react';
import styles from './Banner.module.css';

interface BannerProps {
  tone: 'error' | 'info';
  children: ReactNode;
}

export function Banner({ tone, children }: BannerProps) {
  // role="alert" is announced immediately; errors here mean data may be lost.
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`${styles.banner} ${styles[tone]}`}>
      {children}
    </div>
  );
}
