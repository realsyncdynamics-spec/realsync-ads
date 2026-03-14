"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("https://realsync-dynamics.de");
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePosts = async () => {
    setLoading(true);
    setError(null);
    setPosts(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler");
      setPosts(data.posts);
    } catch (e: any) {
      setError(e.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-4xl font-bold text-center text-indigo-800 mb-4">RealSync Ads</h1>
        <p className="text-center text-gray-600 mb-8">Deine Website &rarr; Fertige Social-Media-Posts in Sekunden.</p>

        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://deine-domain.de" className="w-full p-4 border border-gray-300 rounded-lg mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />

        <button onClick={generatePosts} disabled={loading} className={`w-full py-4 text-white font-semibold rounded-lg transition ${loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>{loading ? "Generiere..." : "Posts erstellen"}</button>

        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}

        {posts && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4">Deine Posts:</h2>
            <pre className="bg-gray-100 p-6 rounded-lg whitespace-pre-wrap text-sm">{posts}</pre>

            <button onClick={async () => { try { const res = await fetch("/api/instagram/post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption: posts }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); alert("Auf Instagram veroeffentlicht!"); } catch (e: any) { alert(e.message); } }} className="mt-4 w-full py-3 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold transition">Direkt auf Instagram posten</button>
          </div>
        )}

        <p className="text-center mt-8 text-sm text-gray-500">Kostenlos testen - Pro-Plan ab 9,90 &euro;/Monat</p>

        <button onClick={async () => { try { const res = await fetch("/api/checkout", { method: "POST" }); const data = await res.json(); if (!res.ok || !data.url) throw new Error(data.error || "Checkout fehlgeschlagen"); window.location.href = data.url; } catch (e: any) { alert(e.message); } }} className="mt-4 w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">Jetzt Pro-Plan starten</button>
      </div>
    </main>
  );
}
