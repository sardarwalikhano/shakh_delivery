"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.push("/dashboard"); router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "چوونەژوورەوە سەرکەوتوو نەبوو.");
    } finally { setBusy(false); }
  }

  async function signInWithGoogle() {
    setGoogleBusy(true); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
      if (error) throw error;
    } catch (error) { setMessage(error instanceof Error ? error.message : "چوونەژوورەوە بە گووگڵ سەرکەوتوو نەبوو."); setGoogleBusy(false); }
  }

  async function sendPasswordReset() {
    if (!email.trim()) { setMessage("سەرەتا ئیمەیڵەکەت بنووسە، پاشان دووبارە کلیک بکە."); return; }
    setResetBusy(true); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      setMessage("ئەگەر ئەم ئیمەیڵە لە سیستەمدا هەبێت، بەستەری گۆڕینی وشەی نهێنی بۆی نێردرا. تکایە Inbox و Spam بپشکنە.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "ناردنی بەستەری گۆڕینی وشەی نهێنی سەرکەوتوو نەبوو."); }
    finally { setResetBusy(false); }
  }

  return <main dir="rtl" className="min-h-screen bg-background px-4 py-12">
    <div className="mx-auto max-w-md rounded-3xl border border-border/10 bg-surface p-7 shadow-sm sm:p-10">
      <Link href="/" className="text-sm font-bold text-primary">← گەڕانەوە بۆ بازاڕ</Link>
      <div className="mt-7 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-white">ش</span><div><h1 className="text-2xl font-black">چوونەژوورەوە</h1><p className="text-sm text-text-secondary">بە هەژماری شاخەکەت بچۆ ژوورەوە.</p></div></div>
      <button type="button" onClick={()=>void signInWithGoogle()} disabled={googleBusy} className="mt-7 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-5 py-3.5 font-bold text-text-primary transition hover:bg-surface-muted disabled:opacity-60"><span className="text-xl font-black">G</span>{googleBusy?"چوونەژوورەوە...":"چوونەژوورەوە بە گووگڵ"}</button>
      <div className="my-5 flex items-center gap-3 text-xs text-text-muted"><span className="h-px flex-1 bg-border"/><span>یان بە ئیمەیڵ</span><span className="h-px flex-1 bg-border"/></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold">ئیمەیڵ<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-primary"/></label>
        <label className="block text-sm font-bold">وشەی نهێنی<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-primary"/></label>
        <button disabled={busy} className="w-full rounded-xl bg-primary px-5 py-3.5 font-bold text-white disabled:opacity-60">{busy?"چاوەڕێ بکە...":"چوونەژوورەوە"}</button>
        <button type="button" disabled={resetBusy} onClick={()=>void sendPasswordReset()} className="w-full text-sm font-bold text-primary underline disabled:opacity-50">{resetBusy?"ناردن...":"وشەی نهێنیت لەبیرچووە؟ بەستەری نوێکردنەوە بنێرە"}</button>
        {message && <p role="status" className="rounded-xl bg-surface-muted p-3 text-sm leading-6 text-text-secondary">{message}</p>}
      </form>
      <p className="mt-5 text-sm text-text-secondary">هەژمارت نییە؟ <Link href="/signup" className="font-bold text-primary">هەژمار دروست بکە</Link></p>
    </div>
  </main>;
}
