'use client';

import { useState, useEffect, FormEvent, ReactNode } from 'react';
import Image from 'next/image';
import { supabase } from './supabase';
const carouselImages = [
  '/slide1.png',
  '/slide2.png',
  '/slide3.png',
  '/slide4.png',
  '/slide5.png',
  '/slide6.png',
  '/slide7.png',
  '/slide8.png',
];

const perksData = [
  {
    title: '01 / Yield Engine & Partner Allocations',
    short: 'Direct $ yield and allocation flow back to holders. Enjoy passive perks funded by studio revenues, secondary volume, and direct partner claims.',
    details: 'A percentage of studio fees and secondary marketplace volume fuels a community vault. Holders gain direct token and NFT claims, high-tier launchpool access, and preferred partner allocations before public access.'
  },
  {
    title: '02 / Absolute Priority Drops & Collabs',
    short: 'By being a borinhood citizen, you sit at the front of every line for all future Idle Hours Studio drops and partner collaborations.',
    details: 'Automatic allowlist access, guaranteed free claim spots, and stealth drop allocations for every upcoming sub-collection, companion drop, and partner co-release under the Idle Hours banner.'
  },
  {
    title: '03 / Commercial IP Rights (Standard, Non-Boring)',
    short: "Full commercial IP grants included out of the box. Use your character's art for merch, branding, or media however you like.",
    details: 'You hold full ownership rights to license, manufacture, and build commercial products using your specific NFT art. No extra hoops, restricted licensing terms, or corporate fluff.'
  }
];

type PageType = 'landing' | 'submission' | 'details' | 'checker';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [username, setUsername] = useState('');
  const [wallet, setWallet] = useState('');
  const [status, setStatus] = useState<{ type: string; message: string }>({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Checker State
  const [checkWallet, setCheckWallet] = useState('');
  const [checkerLoading, setCheckerLoading] = useState(false);
  const [checkerResult, setCheckerResult] = useState<{
    searched: boolean;
    status: 'GTD' | 'FCFS' | 'PROGRESS' | 'NOT_FOUND' | null;
  }>({ searched: false, status: null });

  useEffect(() => {
    if (currentPage !== 'landing') return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [currentPage]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  const toggleAccordion = (index: number) => setOpenAccordionIndex(openAccordionIndex === index ? null : index);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    const cleanWallet = wallet.trim().toLowerCase();

    if (!cleanUsername || !cleanWallet) {
      setStatus({ type: 'error', message: 'Please fill in both fields.' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('directory_submissions')
        .insert([{ username: cleanUsername, wallet_address: cleanWallet }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error('This X handle or wallet address has already been submitted.');
        }
        throw error;
      }

      setStatus({ type: 'success', message: 'Submission successful!' });
      setUsername('');
      setWallet('');
      setShowShareModal(true);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckWallet = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCheckerLoading(true);
    setCheckerResult({ searched: false, status: null });

    const cleanWallet = checkWallet.trim().toLowerCase();

    if (!cleanWallet) {
      setCheckerLoading(false);
      return;
    }

    try {
      // Use ilike to match EVM wallets regardless of capitalization
      const { data: wlData } = await supabase
        .from('allowlist_entries')
        .select('tier')
        .ilike('wallet_address', cleanWallet)
        .maybeSingle();

      if (wlData) {
        const tier = wlData.tier?.toUpperCase();
        if (tier === 'GTD') {
          setCheckerResult({ searched: true, status: 'GTD' });
          setCheckerLoading(false);
          return;
        }
        if (tier === 'FCFS') {
          setCheckerResult({ searched: true, status: 'FCFS' });
          setCheckerLoading(false);
          return;
        }
      }

      const { data: subData } = await supabase
        .from('directory_submissions')
        .select('id')
        .ilike('wallet_address', cleanWallet)
        .maybeSingle();

      if (subData) {
        setCheckerResult({ searched: true, status: 'PROGRESS' });
      } else {
        setCheckerResult({ searched: true, status: 'NOT_FOUND' });
      }
    } catch (err) {
      setCheckerResult({ searched: true, status: 'NOT_FOUND' });
    } finally {
      setCheckerLoading(false);
    }
  };

  const tweetText = encodeURIComponent("Just submitted my entry for borin'hood! 🚀 @borin_hood");
  const tweetUrl = encodeURIComponent("https://borinhood.com");
  const intentUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`;

  return (
    <main className="min-h-screen bg-[#ccff00] text-black font-mono flex flex-col justify-between p-8 select-none overflow-x-hidden">
      
      {/* SUCCESS SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black p-6 max-w-sm w-full text-center space-y-4 shadow-[8px_8px_0px_0px_#000000]">
            <h2 className="text-2xl font-black uppercase tracking-wider">Entry Received!</h2>
            <p className="text-xs font-bold leading-relaxed">Share your entry to increase your chance!</p>
            <a
              href={intentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-black text-white py-2.5 text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors"
            >
              Post on X / Twitter
            </a>
            <button
              onClick={() => setShowShareModal(false)}
              className="block w-full text-xs underline font-bold uppercase tracking-wider text-gray-600 hover:text-black pt-1"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* PAGE SHELL WRAPPER */}
      <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
        
        {/* HEADER */}
        <header className="flex justify-between items-center">
          <button onClick={() => setCurrentPage('landing')} className="focus:outline-none cursor-pointer">
            <Image
              src="/Logoo.png"
              alt="borin'hood"
              width={280}
              height={64}
              className="h-14 w-auto object-contain [image-rendering:pixelated]"
              priority
            />
          </button>
          <Image
            src="/idehours.png"
            alt="iDLE HOUrS Studio"
            width={280}
            height={90}
            className="h-10 w-auto object-contain [image-rendering:pixelated]"
            priority
          />
        </header>

        {/* DYNAMIC CONTENT BY PAGE */}
        {currentPage === 'landing' && (
          <section className="flex flex-col items-center justify-end mt-auto mb-0 w-full">
            <div className="relative w-full max-w-[384px] aspect-square flex items-end justify-center">
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src={carouselImages[currentSlide]}
                  alt={`Art Showcase Slide ${currentSlide + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 384px"
                  className="object-contain"
                  priority
                />
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border-2 border-black px-2 py-0.5 font-bold text-xs hover:bg-black hover:text-white transition-colors z-10"
                  aria-label="Previous Slide"
                >
                  ←
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border-2 border-black px-2 py-0.5 font-bold text-xs hover:bg-black hover:text-white transition-colors z-10"
                  aria-label="Next Slide"
                >
                  →
                </button>
              </div>

              <button
                onClick={() => setCurrentPage('submission')}
                className="absolute left-[calc(140%+1.5rem)] bottom-0 flex flex-col items-center group cursor-pointer focus:outline-none animate-[hop_1.2s_ease-in-out_infinite]"
              >
                <style jsx>{`
                  @keyframes hop {
                    0%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-12px); }
                    50% { transform: translateY(0); }
                    60% { transform: translateY(-4px); }
                  }
                `}</style>
                <span className="text-xs font-bold tracking-tight mb-1 group-hover:-translate-y-0.5 transition-transform whitespace-nowrap">
                  pet me..
                </span>
                <Image 
                  src="/kitten.png" 
                  alt="Kitten" 
                  width={1280}
                  height={1220}
                  className="[image-rendering:pixelated] object-contain group-hover:scale-110 transition-transform duration-200"
                />
              </button>
            </div>
          </section>
        )}

        {currentPage === 'submission' && (
          <section className="relative flex-1 flex flex-col items-center justify-center my-auto w-full max-w-4xl mx-auto">
            <div className="w-full max-w-md">
              <h1 className="text-4xl md:text-5xl font-black tracking-wider mb-6 text-center font-pixel">
                bored?
              </h1>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold mb-1">X Handle</label>
                  <input
                    type="text"
                    placeholder="@yourhandle"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold mb-1">Wallet Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Entry'}
                </button>

                {status.message && (
                  <p className={`text-xs text-center font-bold mt-2 ${status.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                    {status.message}
                  </p>
                )}
              </form>
            </div>

            <button 
              onClick={() => setCurrentPage('details')}
              className="absolute right-0 bottom-0 flex flex-col items-center group cursor-pointer focus:outline-none animate-[pulse_1s_infinite]"
            >
              <span className="text-xs font-bold tracking-tight mb-1 group-hover:-translate-y-0.5 transition-transform whitespace-nowrap animate-[bounce_2s_infinite]">
                pet me..
              </span>
              <Image 
                src="/dog.png" 
                alt="Dog" 
                width={420}
                height={231}
                className="w-24 h-auto [image-rendering:pixelated] object-contain group-hover:scale-110 transition-transform duration-230"
              />
            </button>
          </section>
        )}

        {currentPage === 'details' && (
          <section className="relative flex-1 flex flex-col md:flex-row items-stretch justify-center gap-8 my-auto w-full max-w-5xl mx-auto py-4">
            <div className="w-full md:w-1/3 bg-white border-2 border-black p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-black border-b-2 border-black pb-2 mb-3 uppercase tracking-wider">
                  Mint Details
                </h2>
                <div className="space-y-3 text-xs font-bold">
                  <div>
                    <span className="block text-gray-500 uppercase text-[10px]">Supply</span>
                    <span className="text-sm">2,222</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 uppercase text-[10px]">Chain</span>
                    <span className="text-sm">Robinhood Chain</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 uppercase text-[10px]">Mint Date</span>
                    <span className="text-sm">TBA</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 uppercase text-[10px]">Mint Price</span>
                    <span className="text-sm">TBA</span>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-black pt-3 mt-4 text-[10px] uppercase font-bold text-gray-600">
                [ Idle Hours Studio ]
              </div>
            </div>

            <div className="w-full md:w-2/3 bg-white border-2 border-black p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-black border-b-2 border-black pb-2 mb-3 uppercase tracking-wider">
                  Overview & Perks
                </h2>
                
                <p className="text-xs leading-relaxed font-bold mb-4">
                  Own the full commercial IP? It's good, but boring. borin'hood isn't just your typical PFP: We give you that, while you also get to command the yield and unlock absolute priority access to future drops from our own collaborations or our partners'.
                </p>

                <div className="space-y-2.5">
                  {perksData.map((perk, idx) => (
                    <div key={idx} className="border-2 border-black bg-white">
                      <button
                        onClick={() => toggleAccordion(idx)}
                        className="w-full p-2.5 flex justify-between items-center text-left focus:outline-none hover:bg-black hover:text-white transition-colors"
                      >
                        <span className="text-xs font-black uppercase tracking-wider">
                          {perk.title}
                        </span>
                        <span className="text-xs font-bold font-mono">
                          {openAccordionIndex === idx ? '[-]' : '[+]'}
                        </span>
                      </button>

                      {openAccordionIndex === idx && (
                        <div className="p-2.5 border-t-2 border-black bg-[#f4f4f4] text-black space-y-1.5">
                          <p className="text-[11px] font-bold leading-relaxed">
                            {perk.short}
                          </p>
                          <p className="text-[10px] leading-relaxed text-gray-700 pt-1 border-t border-gray-300">
                            {perk.details}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-black pt-3 mt-4 text-right text-[10px] tracking-widest uppercase font-bold text-gray-600">
                borin' paper lite
              </div>
            </div>
          </section>
        )}

        {currentPage === 'checker' && (
          <section className="relative flex-1 flex flex-col items-center justify-center my-auto w-full max-w-4xl mx-auto">
            <div className="w-full max-w-md">
              <h1 className="text-3xl md:text-4xl font-black tracking-wider mb-6 text-center font-pixel uppercase">
                Allowlist Checker
              </h1>

              <form onSubmit={handleCheckWallet} className="w-full space-y-4">
                <div>
                  <label className="block text-xs uppercase font-bold mb-1">Wallet Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={checkWallet}
                    onChange={(e) => setCheckWallet(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={checkerLoading}
                  className="w-full bg-black text-white py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {checkerLoading ? 'Checking...' : 'Check Eligibility'}
                </button>
              </form>

              {checkerResult.searched && (
                <div className="mt-6 p-4 border-2 border-black bg-white text-center space-y-2">
                  {checkerResult.status === 'GTD' && (
                    <>
                      <p className="text-xs uppercase font-bold text-gray-500">Status</p>
                      <span className="inline-block px-3 py-1 text-xs font-black uppercase border-2 border-black bg-[#ccff00] text-black">
                        GTD CITIZEN
                      </span>
                      <p className="text-[11px] font-bold text-gray-700 pt-1">
                        You're 100% locked in. Guaranteed mint spot secured.
                      </p>
                    </>
                  )}

                  {checkerResult.status === 'FCFS' && (
                    <>
                      <p className="text-xs uppercase font-bold text-gray-500">Status</p>
                      <span className="inline-block px-3 py-1 text-xs font-black uppercase border-2 border-black bg-yellow-300 text-black">
                        FCFS
                      </span>
                      <p className="text-[11px] font-bold text-gray-700 pt-1">
                        FCFS allocation secured. Keep interacting with our post to upgrade your tier.
                      </p>
                    </>
                  )}

                  {checkerResult.status === 'PROGRESS' && (
                    <>
                      <p className="text-xs uppercase font-bold text-gray-500">Status</p>
                      <span className="inline-block px-3 py-1 text-xs font-black uppercase border-2 border-black bg-gray-200 text-black">
                        RAFFLE IN PROGRESS
                      </span>
                      <p className="text-[11px] font-bold text-gray-700 pt-1">
                        We see your submission. Selections are underway. Keep interacting and check back after the snapshot.
                      </p>
                    </>
                  )}

                  {checkerResult.status === 'NOT_FOUND' && (
                    <>
                      <p className="text-xs uppercase font-bold text-gray-500">Status</p>
                      <span className="inline-block px-3 py-1 text-xs font-black uppercase border-2 border-black bg-red-400 text-white">
                        NO SPOT FOUND
                      </span>
                      <p className="text-[11px] font-bold text-gray-700 pt-1">
                        This wallet isn't on the list yet. Keep an eye on partner raffles and collabs.
                      </p>
                      <button
                        onClick={() => {
                          setWallet(checkWallet.trim());
                          setCurrentPage('submission');
                        }}
                        className="mt-3 w-full bg-black text-white py-2 text-xs uppercase font-bold tracking-widest hover:bg-gray-800 transition-colors"
                      >
                        Submit Wallet Now
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="grid grid-cols-3 items-center border-t-4 border-black pt-4">
          <div className="flex items-center justify-start text-xs leading-relaxed">
            {currentPage === 'landing' ? (
              <div className="max-w-xs">
                A collection of 2222<br />
                boring creatives, thinkers,<br />
                and builders navigating<br />
                the Robinhood Chain ecosystem.
              </div>
            ) : (
              <button 
                onClick={() => setCurrentPage('landing')} 
                className="border border-black bg-transparent rounded-full px-3 py-1 text-xs hover:bg-black hover:text-white transition-colors"
              >
                ← Back
              </button>
            )}
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setCurrentPage('checker')}
              className="border border-black bg-transparent rounded-full px-3 py-1 text-xs hover:bg-black hover:text-white transition-colors"
            >
              Wallet Checker
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button className="border border-black bg-transparent rounded-full px-2.5 py-1 text-xs hover:bg-black hover:text-white transition-colors">
              X
            </button>
            <button className="border border-black bg-transparent rounded-full px-2.5 py-1 text-xs hover:bg-black hover:text-white transition-colors">
              Discord
            </button>
            <button className="border border-black bg-transparent rounded-full px-2.5 py-1 text-xs hover:bg-black hover:text-white transition-colors">
              OpenSea
            </button>
          </div>
        </footer>

      </div>
    </main>
  );
}