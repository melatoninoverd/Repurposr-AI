'use client';

import { useState, useEffect } from 'react';
import { createClient } from './lib/supabase';

export default function Home() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [freeUsesLeft, setFreeUsesLeft] = useState(3);

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = async () => {
    setLoadingLogin(true);
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
      alert("Please sign in to use Repurposr");
      return;
    }
    if (freeUsesLeft <= 0) {
      alert("You've used all free tries. Upgrade to Pro for unlimited access ($19/mo)");
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
    setLoadingUpgrade(true);
    try {
      const res = await fetch('/api/create-checkout', { method: 'POST' });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        alert("Checkout failed. Try again.");
      }
    } catch (err) {
      alert("Something went wrong. Try again.");
    }
    setLoadingUpgrade(false);
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
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-light tracking-tighter">repurposr</div>
          </div>

          <div className="flex items-center gap-8">
            {user ? (
              <>
                <span className="text-zinc-400 text-sm">hi {user.email?.split('@')[0]}</span>
                <button 
                  onClick={handleLogout} 
                  className="text-sm text-zinc-400 hover:text-white cursor-pointer transition"
                >
                  log out
                </button>
              </>
            ) : (
              <button 
                onClick={handleLogin}
                disabled={loadingLogin}
                className="text-sm font-medium px-6 py-3 rounded-2xl border border-zinc-700 hover:bg-white hover:text-black transition cursor-pointer disabled:opacity-50"
              >
                {loadingLogin ? "signing in..." : "sign in with google"}
              </button>
            )}

            <button 
              onClick={handleUpgrade}
              disabled={loadingUpgrade}
              className="bg-white text-black px-8 py-3 rounded-2xl font-medium hover:bg-zinc-100 transition cursor-pointer disabled:opacity-50"
            >
              {loadingUpgrade ? "redirecting..." : "upgrade • $19/mo"}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 pt-24 pb-32">
        <div className="text-center mb-20">
          <h1 className="text-7xl font-light tracking-tighter leading-none mb-4">
            one post.<br />everywhere.
          </h1>
          <p className="text-2xl text-zinc-400 max-w-md mx-auto">
            paste once. get clean versions for every platform.
          </p>
        </div>

        {user && (
          <div className="flex justify-center mb-12">
            <div className="bg-zinc-900 border border-zinc-700 rounded-3xl px-8 py-4 flex items-center gap-4">
              <span className="text-zinc-400 text-sm">free uses left</span>
              <div className="flex gap-2">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-5 h-5 rounded-2xl ${i <= freeUsesLeft ? 'bg-white' : 'bg-zinc-700'}`} />
                ))}
              </div>
              <span className="font-medium text-white">{freeUsesLeft}/3</span>
            </div>
          </div>
        )}

        <textarea
          className="w-full h-80 bg-zinc-900 border border-zinc-700 rounded-3xl p-8 text-lg placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition resize-none"
          placeholder="paste your content here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button 
          onClick={handleRepurpose}
          disabled={loading || !input.trim()}
          className="mt-8 w-full py-7 text-2xl font-medium rounded-3xl border border-zinc-700 hover:border-white transition group relative overflow-hidden cursor-pointer"
        >
          <span className="relative z-10">repurpose my content</span>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition"></div>
        </button>

        {results && (
          <div className="mt-24">
            <h3 className="text-4xl font-light tracking-tighter mb-12 text-center">your versions</h3>
            <div className="space-y-12">
              {versions && typeof versions === 'object' ? (
                Object.entries(versions).map(([platform, content]) => (
                  <div key={platform} className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10">
                    <h4 className="uppercase text-xs tracking-widest text-zinc-400 mb-6">{platform}</h4>
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

      {/* Copyright Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-8 text-center text-xs text-zinc-500">
          © 2026 Repurposr. All rights reserved.
        </div>
      </footer>
    </div>
  );
}