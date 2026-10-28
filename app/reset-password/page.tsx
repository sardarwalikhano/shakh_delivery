"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setReady(true);
      if (error || !data.session) setMessage("بەستەری گۆڕینی وشەی نهێنی ناتەواوە یان بەسەرچووە. تکایە لە پەڕەی چوونەژوورەوە داوای بەستەرێکی نوێ بکە.");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) setMessage("");
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) { setMessage("وشەی نهێنی دەبێت لانیکەم ٨ پیت بێت."); return; }
    if (password !== confirmPassword) { setMessage("دوو وشەی نهێنییەکە یەکسان نین."); return; }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("بەستەرەکە بەسەرچووە. تکایە داوای بەستەرێکی نوێ بکە.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("وشەی نهێنی نوێ کرایەوە. ئێستا دەچیتە داشبۆرد.");
      window.setTimeout(() => { router.replace("/dashboard"); router.refresh(); }, 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "گۆڕینی وشەی نهێنی سەرکەوتوو نەبوو.");
    } finally { setBusy(false); }
  }

  return <main dir="rtl" className="min-h-screen bg-[#f8faf7] px-4 py-12">
    <section className="mx-auto max-w-md rounded-3xl border bg-white p-7 shadow-sm sm:p-10">
      <Link href="/login" className="text-sm font-bold text-green-800">گەڕانەوە بۆ چوونەژوورەوە</Link>
      <h1 className="mt-7 text-2xl font-black">گۆڕینی وشەی نهێنی</h1>
      <p className="mt-2 text-sm leading-7 text-slate-500">وشەی نهێنییەکی نوێ و بەهێز هەڵبژێرە.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-bold">وشەی نهێنی نوێ<input required minLength={8} autoComplete="new-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-green-700"/></label>
        <label className="block text-sm font-bold">دووبارە وشەی نهێنی بنووسە<input required minLength={8} autoComplete="new-password" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-green-700"/></label>
        <button disabled={!ready || busy || !!message.startsWith("بەستەری گۆڕینی")} className="w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white disabled:opacity-50">{busy?"چاوەڕێ بکە...":"پاشەکەوتکردنی وشەی نهێنی"}</button>
        {message && <p role="status" className="rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-700">{message}</p>}
      </form>
    </section>
  </main>;
}
