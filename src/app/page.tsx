import type { NextPage } from 'next';
import Head from 'next/head';
import { HeroSection } from '../app/components/HeroSection';
import { ExamCategories } from '../app/components/ExamCategories';
import { Features } from '../app/components/Features';
import {ExamSelection} from '../app/components/ExamSelection'

const Home: NextPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>PrepBook - Your Exam Prep Partner</title>
        <meta name="description" content="Prepare for government exams with PrepBook. Get live classes, mock tests, and more." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      

      <main>
        <HeroSection />
        <ExamSelection/>
        <ExamCategories />
        <Features />
        {/* आप यहाँ और भी कंपोनेंट्स जोड़ सकते हैं जैसे Testimonials, Stats, Footer आदि */}
      </main>
      
    </div>
  );
};

export default Home;