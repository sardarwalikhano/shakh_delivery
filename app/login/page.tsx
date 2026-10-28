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

  return <main dir="rtl" className="min-h-screen bg-[#f8faf7] px-4 py-12">
    <div className="mx-auto max-w-md rounded-3xl border border-green-950/10 bg-white p-7 shadow-sm sm:p-10">
      <Link href="/" className="text-sm font-bold text-green-800">← گەڕانەوە بۆ بازاڕ</Link>
      <div className="mt-7 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1d6b38] text-2xl font-black text-white">ش</span><div><h1 className="text-2xl font-black">چوونەژوورەوە</h1><p className="text-sm text-slate-500">بە هەژماری شاخەکەت بچۆ ژوورەوە.</p></div></div>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-bold">ئیمەیڵ<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-green-700"/></label>
        <label className="block text-sm font-bold">وشەی نهێنی<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-green-700"/></label>
        <button disabled={busy} className="w-full rounded-xl bg-[#1d6b38] px-5 py-3.5 font-bold text-white disabled:opacity-60">{busy?"چاوەڕێ بکە...":"چوونەژوورەوە"}</button>
        {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800">{message}</p>}
      </form>
      <p className="mt-5 text-sm text-slate-600">هەژمارت نییە؟ <Link href="/signup" className="font-bold text-green-800">هەژمار دروست بکە</Link></p>
    </div>
  </main>;
}
