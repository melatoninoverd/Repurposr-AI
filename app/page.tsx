'use client';

import { useState, useEffect } from 'react';
import { createClient } from './lib/supabase';

export default function Home() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, [supabase]);

  const handleLogin = async () => {
    const liveUrl = "https://repurposr-ai.vercel.app";
  
    console.log("🔥 Login clicked - redirecting to:", liveUrl);
  
    await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { 
      redirectTo: liveUrl 
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleRepurpose = async () => {
    setError('');
    if (!user) {
      alert("Please log in with Google first!");
      return;
    }
    if (input.trim().length < 30) {
      setError("Please paste at least 30 characters of content.");
      return;
    }
    
    setLoading(true);
    
    const res = await fetch('/api/repurpose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });
    
    const data = await res.json();
    
    if (data.error) {
      setError(data.error);
    } else {
      setResults(data);
    }
    
    setLoading(false);
  };

  const handleUpgrade = async () => {
    const res = await fetch('/api/create-checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Payment link failed. Try again.");
    }
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
        <div className="max-w-5xl mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔄</div>
            <h1 className="text-3xl font-semibold tracking-tight">Repurposr</h1>
          </div>
          
          {user && (
            <button 
              onClick={handleUpgrade}
              className="bg-white text-black px-6 py-2.5 rounded-2xl font-semibold hover:bg-amber-300 transition"
            >
              Upgrade to Pro — $19/mo
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 pt-16 pb-24">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-6xl font-bold tracking-tighter mb-6">
            One post.<br />Everywhere.
          </h2>
          <p className="text-2xl text-zinc-400">Paste once. Get perfectly optimized versions for every platform.</p>
        </div>

        <textarea
          className="w-full h-80 bg-zinc-900 border border-zinc-700 rounded-3xl p-8 text-lg placeholder-zinc-500 focus:outline-none focus:border-white"
          placeholder="Paste your content here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button 
          onClick={handleRepurpose}
          disabled={loading || !input.trim()}
          className="mt-8 w-full bg-white text-black py-6 text-2xl font-semibold rounded-3xl hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Repurposing across platforms..." : "Repurpose My Content"}
        </button>

        {error && (
          <div className="mt-6 text-red-500 text-center font-medium">{error}</div>
        )}

        {results && (
          <div className="mt-20">
            <h3 className="text-4xl font-bold mb-10 text-center">Your Ready-to-Post Versions</h3>
            <div className="space-y-10">
              {versions && typeof versions === 'object' ? (
                Object.entries(versions).map(([platform, content]) => (
                  <div key={platform} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10">
                    <h4 className="uppercase tracking-widest text-xs text-zinc-500 mb-4">{platform}</h4>
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