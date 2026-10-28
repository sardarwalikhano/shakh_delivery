"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"customer" | "merchant" | "captain">("customer");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  async function signUpWithGoogle() {
    setGoogleBusy(true); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      window.sessionStorage.setItem("shakh_google_signup_role", JSON.stringify({ role, at: Date.now() }));
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
      if (error) throw error;
    } catch (error) { setMessage(error instanceof Error ? error.message : "دروستکردنی هەژمار بە گووگڵ سەرکەوتوو نەبوو."); setGoogleBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim(), phone: phone.trim(), requested_role: role } },
      });
      if (error) throw error;
      setMessage("هەژمارەکەت دروست کرا. ئەگەر پشتڕاستکردنەوەی ئیمەیڵ چالاک بێت، تکایە ئیمەیڵەکەت بپشکنە. هەڵبژاردنی دوکاندار یان کاپتن بە مانای پەسەندکردنی ڕۆڵ نییە؛ سوپەر ئەدمین دەبێت پەسەندی بکات.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "دروستکردنی هەژمار سەرکەوتوو نەبوو.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-background px-4 py-10" dir="rtl">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-border/10 bg-surface shadow-sm md:grid-cols-2">
      <section className="bg-primary p-8 text-white sm:p-10">
        <Link href="/" className="inline-flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-2xl font-black text-[var(--color-primary)]">ش</span><span><b className="block text-2xl">شاخ</b><small className="text-white/65">SHAKH DELIVERY</small></span></Link>
        <h1 className="mt-12 text-3xl font-black leading-relaxed">بە شاخەوە،<br/>ئاسانتر دەست پێ بکە.</h1>
        <p className="mt-4 leading-8 text-white/75">هەژمارێک دروست بکە بۆ کڕین، بەڕێوەبردنی دوکان، یان داواکاریی کاپتنی گەیاندن.</p>
        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-surface/10 p-4"><ShieldCheck className="mt-1 shrink-0"/><p className="text-sm leading-7">ڕۆڵی دوکاندار و کاپتن پێویستی بە پەسەندکردنی بەڕێوەبەرایەتی هەیە. هیچ بەکارهێنەرێک ناتوانێت خۆی ببێتە ئەدمین.</p></div>
      </section>
      <section className="p-6 sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary"><ArrowRight size={16}/> گەڕانەوە بۆ بازاڕ</Link>
        <h2 className="mt-6 text-2xl font-black">دروستکردنی هەژمار</h2>
        <p className="mt-2 text-sm text-text-secondary">زانیارییەکانت پڕ بکەرەوە.</p>
        <button type="button" onClick={()=>void signUpWithGoogle()} disabled={googleBusy} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-5 py-3.5 font-bold text-text-primary transition hover:bg-surface-muted disabled:opacity-60"><span className="text-xl font-black">G</span>{googleBusy?"چاوەڕێ بکە...":"بەردەوامبوون بە گووگڵ"}</button>
        <div className="my-5 flex items-center gap-3 text-xs text-text-muted"><span className="h-px flex-1 bg-border"/><span>یان بە ئیمەیڵ</span><span className="h-px flex-1 bg-border"/></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-bold">ناوی تەواو<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-primary" placeholder="ناوی تەواوت"/></label>
          <label className="block text-sm font-bold">ئیمەیڵ<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-primary" placeholder="you@example.com"/></label>
          <label className="block text-sm font-bold">ژمارەی مۆبایل <span className="font-normal text-text-muted">(ئارەزوومەندانە)</span><input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-primary" placeholder="07xx xxx xxxx"/></label>
          <label className="block text-sm font-bold">وشەی نهێنی<div className="relative mt-2"><input required type={showPassword ? "text" : "password"} minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 pl-12 font-normal outline-none focus:border-primary" placeholder="لانیکەم ٨ پیت"/><button type="button" aria-label={showPassword ? "شاردنەوەی وشەی نهێنی" : "پیشاندانی وشەی نهێنی"} aria-pressed={showPassword} onClick={()=>setShowPassword(value=>!value)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-secondary hover:bg-surface-muted">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
          <fieldset><legend className="mb-2 text-sm font-bold">ڕۆڵی خۆت هەڵبژێرە</legend><div className="grid grid-cols-3 gap-2">{([{value:"customer",label:"کڕیار"},{value:"merchant",label:"دوکاندار"},{value:"captain",label:"کاپتن"}] as const).map(x=><button key={x.value} type="button" onClick={()=>setRole(x.value)} className={"rounded-xl border px-2 py-3 text-sm font-bold "+(role===x.value?"border-primary bg-secondary text-primary":"border-border text-text-secondary")}>{x.label}</button>)}</div></fieldset>
          <button disabled={busy} type="submit" className="w-full rounded-xl bg-primary px-5 py-3.5 font-bold text-white disabled:opacity-60">{busy?"چاوەڕێ بکە...":"دروستکردنی هەژمار"}</button>
          {message&&<p role="status" className="rounded-xl bg-surface-muted p-3 text-sm leading-7 text-text-secondary">{message}</p>}
        </form>
        <p className="mt-5 text-sm text-text-secondary">پێشتر هەژمارت هەیە؟ <Link href="/login" className="font-bold text-primary">چوونەژوورەوە</Link></p>
      </section>
    </div>
  </main>;
}
