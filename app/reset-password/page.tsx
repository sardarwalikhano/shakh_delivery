"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  return <main dir="rtl" className="min-h-screen bg-background px-4 py-12">
    <section className="mx-auto max-w-md rounded-3xl border bg-surface p-7 shadow-sm sm:p-10">
      <Link href="/login" className="text-sm font-bold text-primary">گەڕانەوە بۆ چوونەژوورەوە</Link>
      <h1 className="mt-7 text-2xl font-black">گۆڕینی وشەی نهێنی</h1>
      <p className="mt-2 text-sm leading-7 text-text-secondary">وشەی نهێنییەکی نوێ و بەهێز هەڵبژێرە.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-bold">وشەی نهێنی نوێ<div className="relative mt-2"><input required minLength={8} autoComplete="new-password" type={showPassword ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 pl-12 font-normal outline-none focus:border-primary"/><button type="button" aria-label={showPassword ? "شاردنەوەی وشەی نهێنی" : "پیشاندانی وشەی نهێنی"} aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-secondary hover:bg-surface-muted">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <label className="block text-sm font-bold">دووبارە وشەی نهێنی بنووسە<div className="relative mt-2"><input required minLength={8} autoComplete="new-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 pl-12 font-normal outline-none focus:border-primary"/><button type="button" aria-label={showConfirmPassword ? "شاردنەوەی وشەی نهێنی" : "پیشاندانی وشەی نهێنی"} aria-pressed={showConfirmPassword} onClick={()=>setShowConfirmPassword(value=>!value)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-secondary hover:bg-surface-muted">{showConfirmPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <button disabled={!ready || busy || !!message.startsWith("بەستەری گۆڕینی")} className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50">{busy?"چاوەڕێ بکە...":"پاشەکەوتکردنی وشەی نهێنی"}</button>
        {message && <p role="status" className="rounded-xl bg-surface-muted p-3 text-sm leading-7 text-text-secondary">{message}</p>}
      </form>
    </section>
  </main>;
}
