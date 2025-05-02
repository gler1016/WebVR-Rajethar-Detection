// pages/index.tsx
import Head from 'next/head';
import ARScanner from '@/components/ARScanner';

export default function Home() {
  return (
    <>
      <Head>
        <title>WebAR Measurement Tool</title>
      </Head>
      <main>
        <ARScanner />
      </main>
    </>
  );
}
