'use client';

import { useState, useEffect } from 'react';
import { createClient } from './lib/supabase';

export default function Home() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [freeUsesLeft, setFreeUsesLeft] = useState(3);

  const [supabase] = useState(() => createClient());

  // Listen for login state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleRepurpose = async () => {
    if (!user) {
      alert("Please log in first to use the tool 🔥");
      return;
    }
    if (freeUsesLeft <= 0) {
      alert("You've used all free tries! Upgrade to Pro for unlimited ($19/mo)");
      return;
    }

    setLoading(true);
    const res = await fetch('/api/repurpose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });
    const data = await res.json();
    setResults(data);
    setFreeUsesLeft(prev => prev - 1);
    setLoading(false);
  };

  const handleUpgrade = async () => {
    const res = await fetch('/api/create-checkout', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  const cleanVersions = (raw: string) => {
    try {
      let jsonStr = raw.trim();
      if (jsonStr.includes("```json")) jsonStr = jsonStr.split("```json")[1].split("```")[0];
      else if (jsonStr.includes("```")) jsonStr = jsonStr.split("```")[1].split("```")[0];
      const firstBrace = jsonStr.indexOf('{');
      if (firstBrace > 0) jsonStr = jsonStr.substring(firstBrace);
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  };

  const versions = results?.versions ? cleanVersions(results.versions) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Fancy Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl">🔄</div>
            <h1 className="text-3xl font-bold tracking-tighter">Repurposr</h1>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <span className="text-zinc-400 text-sm">Hi, {user.email?.split('@')[0]}</span>
                <button onClick={handleLogout} className="text-zinc-400 hover:text-white text-sm">Log out</button>
              </>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-white text-black px-8 py-3 rounded-2xl font-semibold hover:bg-zinc-100 transition"
              >
                Sign in with Google
              </button>
            )}

            <button 
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-amber-400 to-yellow-400 text-black px-8 py-3 rounded-2xl font-semibold hover:scale-105 transition"
            >
              Upgrade to Pro — $19/mo
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-7xl font-bold tracking-tighter leading-none mb-6">
            One post.<br />Everywhere.
          </h2>
          <p className="text-3xl text-zinc-400 mb-8">
            Paste once. Get perfectly optimized versions for X, LinkedIn, TikTok, Instagram, YouTube & more.
          </p>

          {user && (
            <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-3xl px-8 py-4 mb-12">
              <div className="text-amber-400 font-medium">Free uses left:</div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-6 h-6 rounded-2xl ${i < freeUsesLeft ? 'bg-amber-400' : 'bg-zinc-700'}`} />
                ))}
              </div>
              <span className="font-semibold text-amber-400">{freeUsesLeft}/3</span>
            </div>
          )}
        </div>

        <textarea
          className="w-full h-80 bg-zinc-900 border border-zinc-700 rounded-3xl p-8 text-lg placeholder-zinc-400 focus:outline-none focus:border-purple-500 transition resize-none"
          placeholder="Paste your blog, transcript, podcast notes, or idea here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button 
          onClick={handleRepurpose}
          disabled={loading || !input.trim()}
          className="mt-8 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-7 text-2xl font-semibold rounded-3xl hover:scale-[1.02] transition disabled:opacity-50"
        >
          {loading ? "Working magic across platforms ✨" : "Repurpose My Content"}
        </button>

        {results && (
          <div className="mt-24">
            <h3 className="text-4xl font-bold mb-12 text-center">Here’s your fresh content 🔥</h3>
            <div className="space-y-12">
              {versions && typeof versions === 'object' ? (
                Object.entries(versions).map(([platform, content]) => (
                  <div key={platform} className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10">
                    <h4 className="uppercase text-xs tracking-[1px] text-zinc-400 mb-6">{platform}</h4>
                    <div className="whitespace-pre-wrap text-zinc-200 leading-relaxed text-[15.5px]">
                      {String(content)}
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}