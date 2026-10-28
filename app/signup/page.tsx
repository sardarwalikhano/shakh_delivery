"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "merchant" | "captain">("customer");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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

  return <main className="min-h-screen bg-[#f8faf7] px-4 py-10" dir="rtl">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-green-950/10 bg-white shadow-sm md:grid-cols-2">
      <section className="bg-[#143d25] p-8 text-white sm:p-10">
        <Link href="/" className="inline-flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-black text-[#1d6b38]">ش</span><span><b className="block text-2xl">شاخ</b><small className="text-white/65">SHAKH DELIVERY</small></span></Link>
        <h1 className="mt-12 text-3xl font-black leading-relaxed">بە شاخەوە،<br/>ئاسانتر دەست پێ بکە.</h1>
        <p className="mt-4 leading-8 text-white/75">هەژمارێک دروست بکە بۆ کڕین، بەڕێوەبردنی دوکان، یان داواکاریی کاپتنی گەیاندن.</p>
        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-white/10 p-4"><ShieldCheck className="mt-1 shrink-0"/><p className="text-sm leading-7">ڕۆڵی دوکاندار و کاپتن پێویستی بە پەسەندکردنی بەڕێوەبەرایەتی هەیە. هیچ بەکارهێنەرێک ناتوانێت خۆی ببێتە ئەدمین.</p></div>
      </section>
      <section className="p-6 sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-green-800"><ArrowRight size={16}/> گەڕانەوە بۆ بازاڕ</Link>
        <h2 className="mt-6 text-2xl font-black">دروستکردنی هەژمار</h2>
        <p className="mt-2 text-sm text-slate-500">زانیارییەکانت پڕ بکەرەوە.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">ناوی تەواو<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-green-700" placeholder="ناوی تەواوت"/></label>
          <label className="block text-sm font-bold">ئیمەیڵ<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-green-700" placeholder="you@example.com"/></label>
          <label className="block text-sm font-bold">ژمارەی مۆبایل <span className="font-normal text-slate-400">(ئارەزوومەندانە)</span><input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-green-700" placeholder="07xx xxx xxxx"/></label>
          <label className="block text-sm font-bold">وشەی نهێنی<input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-green-700" placeholder="لانیکەم ٨ پیت"/></label>
          <fieldset><legend className="mb-2 text-sm font-bold">ڕۆڵی خۆت هەڵبژێرە</legend><div className="grid grid-cols-3 gap-2">{([{value:"customer",label:"کڕیار"},{value:"merchant",label:"دوکاندار"},{value:"captain",label:"کاپتن"}] as const).map(x=><button key={x.value} type="button" onClick={()=>setRole(x.value)} className={"rounded-xl border px-2 py-3 text-sm font-bold "+(role===x.value?"border-green-700 bg-green-50 text-green-800":"border-slate-200 text-slate-600")}>{x.label}</button>)}</div></fieldset>
          <button disabled={busy} type="submit" className="w-full rounded-xl bg-[#1d6b38] px-5 py-3.5 font-bold text-white disabled:opacity-60">{busy?"چاوەڕێ بکە...":"دروستکردنی هەژمار"}</button>
          {message&&<p role="status" className="rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-700">{message}</p>}
        </form>
      </section>
    </div>
  </main>;
}
