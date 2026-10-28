"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Profile = { id: string; display_name: string; phone: string | null; requested_role: string; approved_role: string; created_at: string };
type Wallet = { id: string; owner_type: string; balance_iqd: number };
const roleLabel: Record<string,string> = { customer:"کڕیار", merchant:"دوکاندار", captain:"کاپتن", admin:"ئەدمین", super_admin:"سوپەر ئەدمین" };

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile|null>(null);
  const [pending, setPending] = useState<Profile[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { router.replace("/login"); return; }
    const { data: me, error } = await supabase.from("profiles").select("id,display_name,phone,requested_role,approved_role,created_at").eq("id", user.id).single();
    if (error) { setMessage("نەتوانرا زانیاری هەژمار بخوێندرێتەوە. دڵنیابە migration و Supabase env ڕێکن."); setLoading(false); return; }
    setProfile(me as Profile);
    const { data: walletData } = await supabase.from("wallets").select("id,owner_type,balance_iqd").eq("owner_id", user.id);
    setWallets((walletData ?? []) as Wallet[]);
    if (["admin","super_admin"].includes(me.approved_role)) {
      const { data: requests, error: reqError } = await supabase.from("profiles").select("id,display_name,phone,requested_role,approved_role,created_at").in("requested_role", ["merchant","captain"]).neq("approved_role", "merchant").neq("approved_role", "captain").order("created_at", { ascending: true });
      if (reqError) setMessage("نەتوانرا داواکارییەکان باربکرێن.");
      setPending((requests ?? []) as Profile[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut(); router.replace("/login"); router.refresh();
  }
  async function review(id: string, approve: boolean) {
    setBusyId(id); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("review_role_request", { target_user_id: id, approve });
      if (error) throw error;
      setMessage(approve ? "ڕۆڵەکە پەسەند کرا و جزدانی بۆ دروست کرا." : "داواکارییەکە ڕەتکرایەوە.");
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "کردارەکە سەرکەوتوو نەبوو."); }
    finally { setBusyId(""); }
  }

  if (loading) return <main dir="rtl" className="min-h-screen bg-[#f8faf7] p-8">داشبۆرد بار دەکرێت...</main>;
  return <main dir="rtl" className="min-h-screen bg-[#f8faf7] px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[#143d25] p-6 text-white sm:p-8">
        <div><Link href="/" className="text-sm text-white/70">شاخ / بازاڕ</Link><h1 className="mt-2 text-3xl font-black">داشبۆرد</h1><p className="mt-2 text-white/75">{profile?.display_name || "بەکارهێنەر"} · {roleLabel[profile?.approved_role ?? ""] ?? "ڕۆڵی نەناسراو"}</p></div>
        <button onClick={signOut} className="rounded-xl border border-white/30 px-4 py-2 font-bold">دەرچوون</button>
      </header>
      {message && <p role="status" className="mt-4 rounded-xl bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm">{message}</p>}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">دۆخی هەژمار</p><h2 className="mt-2 text-xl font-black">{roleLabel[profile?.approved_role ?? ""]}</h2><p className="mt-2 text-sm text-slate-500">ڕۆڵی داواکراو: {roleLabel[profile?.requested_role ?? ""]}</p></article>
        {wallets.map(w=><article key={w.id} className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">جزدان · {roleLabel[w.owner_type] ?? w.owner_type}</p><h2 className="mt-2 text-2xl font-black">{Number(w.balance_iqd).toLocaleString("en-US")} د.ع</h2><p className="mt-2 text-sm text-slate-500">بڕی جزدان بە داتابەیسەوە پەیوەستە.</p></article>)}
      </section>
      {profile?.requested_role !== "customer" && profile?.approved_role === "customer" && <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-black">چاوەڕێی پەسەندکردن</h2><p className="mt-2 text-sm leading-7">داواکاریی {roleLabel[profile?.requested_role ?? ""]} هێشتا پەسەند نەکراوە. تا پەسەندکردن، دەسەڵاتی ئەو ڕۆڵەت نییە.</p></section>}
      {profile && ["admin","super_admin"].includes(profile.approved_role) && <section className="mt-8"><div className="mb-4"><h2 className="text-2xl font-black">پەسەندکردنی هەژمارەکان</h2><p className="mt-1 text-sm text-slate-500">تەنها داواکاریی دوکاندار و کاپتن پیشان دەدرێت.</p></div>
        {pending.length===0 ? <div className="rounded-2xl border bg-white p-6 text-slate-500">هیچ داواکارییەکی چاوەڕوان نییە.</div> : <div className="space-y-3">{pending.map(p=><article key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5"><div><h3 className="font-black">{p.display_name || "بەکارهێنەر"}</h3><p className="mt-1 text-sm text-slate-500">{roleLabel[p.requested_role] ?? p.requested_role} · {p.phone || "ژمارەی مۆبایل نییە"}</p><p className="mt-1 text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString("ckb")}</p></div><div className="flex gap-2"><button disabled={!!busyId} onClick={()=>void review(p.id,true)} className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busyId===p.id?"...":"پەسەندکردن"}</button><button disabled={!!busyId} onClick={()=>void review(p.id,false)} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50">ڕەتکردنەوە</button></div></article>)}</div>}
      </section>}
      {profile?.approved_role === "merchant" && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">بەڕێوەبردنی دوکان</h2><p className="mt-2 text-sm leading-7 text-slate-600">هەژمارەکەت پەسەند کراوە. زیادکردنی دوکان، بەرهەم، کۆمسیۆن و پاداشتی هاوبەشکردن قۆناغی داهاتوویە؛ هێشتا لەم داشبۆردەدا چالاک نەکراون.</p></section>}
      {profile?.approved_role === "captain" && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">داشبۆردی کاپتن</h2><p className="mt-2 text-sm leading-7 text-slate-600">جزدان و ڕۆڵەکەت لێرە پیشان دەدرێت. وەرگرتنی گەیاندن و حیساباتی کۆمسیۆن پێویستی بە قۆناغی جیاواز هەیە.</p></section>}
      {profile?.approved_role === "customer" && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="text-xl font-black">داشبۆردی کڕیار</h2><p className="mt-2 text-sm leading-7 text-slate-600">بەخێربێیت. بەشی داواکارییەکان و بەدواداچوونی گەیاندن لە قۆناغی داهاتوودا زیاد دەکرێت.</p><Link href="/" className="mt-4 inline-block rounded-xl bg-green-700 px-4 py-2 font-bold text-white">چوون بۆ بازاڕ</Link></section>}
    </div>
  </main>;
}
