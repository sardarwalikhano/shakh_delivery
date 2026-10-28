"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBasket, MapPin, Utensils, Carrot, Store, RefreshCw, CircleAlert, Plus, Gift } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Product = { id:string; name:string; price_iqd:number; share_reward_iqd:number; share_reward_enabled:boolean; store_id:string; stores:{name:string;category:string} };
type Category = "all" | "restaurant" | "grocery" | "produce";
const money = (value:number) => new Intl.NumberFormat("en-US").format(value) + " د.ع";
const labels:Record<Category,string> = {all:"هەموویان",restaurant:"خواردن و چێشتخانە",grocery:"سوپەرمارکێت",produce:"سەوزە و میوە"};

export default function Home() {
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState<Category>("all");
  const [products,setProducts]=useState<Product[]>([]);
  const [cart,setCart]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");

  async function loadProducts() {
    setLoading(true); setError("");
    try {
      const supabase=createSupabaseBrowserClient();
      const {data,error:queryError}=await supabase.from("products")
        .select("id,name,price_iqd,share_reward_iqd,share_reward_enabled,store_id,stores!inner(name,category,is_approved)")
        .eq("is_available",true).eq("stores.is_approved",true).order("name");
      if(queryError) throw queryError;
      setProducts((data??[]) as unknown as Product[]);
    } catch { setError("نەتوانرا بەرهەمەکان باربکرێن. ڕێکخستنی Supabase و پەیوەندی ئینتەرنێت بپشکنە."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{void loadProducts();},[]);
  const filtered=useMemo(()=>products.filter(p=>(p.name+" "+p.stores.name).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())&&(category==="all"||p.stores.category===category)),[products,search,category]);
  const selected=products.filter(p=>cart.includes(p.id));
  const total=selected.reduce((sum,p)=>sum+Number(p.price_iqd),0);
  const stores=Array.from(new Map(products.map(p=>[p.store_id,p])).values());
  const categoryItems:[Category,string,typeof Utensils][]=[["restaurant","خواردن و چێشتخانە",Utensils],["grocery","سوپەرمارکێت",ShoppingBasket],["produce","سەوزە و میوە",Carrot]];

  return <main className="min-h-screen bg-background pb-24 text-text-primary">
    <div className="bg-primary text-primary-foreground"><div className="mx-auto flex max-w-content items-center justify-between px-4 py-2 text-xs sm:px-6"><span className="flex items-center gap-2"><MapPin size={14}/> شاخ دێلڤەری</span><span>خواردن و پێداویستی لە یەک شوێن</span></div></div>
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur"><div className="mx-auto flex max-w-content flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
      <Link href="/" aria-label="شاخ، سەرەتا" className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-2xl font-black text-primary-foreground">ش</span><span><b className="block text-xl font-black text-primary">شاخ</b><small className="text-xs text-text-muted">SHAKH DELIVERY</small></span></Link>
      <label className="order-3 flex w-full items-center gap-2 rounded-control border border-border bg-surface-muted px-3 py-2.5 sm:order-none sm:ml-auto sm:w-auto sm:min-w-64 sm:max-w-md sm:flex-1"><Search size={18} className="text-text-muted"/><input aria-label="گەڕان لە بەرهەم و دوکان" value={search} onChange={e=>setSearch(e.target.value)} placeholder="گەڕان لە بەرهەم و دوکان..." className="w-full bg-transparent text-sm outline-none"/></label>
      <nav aria-label="ناوبەری سەرەکی" className="mr-auto flex gap-2"><Link href="/login" className="rounded-control border border-border px-3 py-2 text-sm font-bold hover:bg-surface-muted">چوونەژوورەوە</Link><Link href="/signup" className="rounded-control bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-hover">هەژمار دروست بکە</Link></nav>
    </div></header>

    <section className="mx-auto grid max-w-content gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:items-center md:py-14">
      <div><span className="inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-bold text-primary">بازاڕی شاخ</span><h1 className="mt-5 text-4xl font-black leading-relaxed sm:text-5xl">پێداویستییەکانت،<br/><span className="text-primary">بە ئاسانی لە شاخ</span></h1><p className="mt-4 max-w-xl leading-8 text-text-secondary">بەرهەمە بەردەستەکان بگەڕێ و دوکانەکان ببینە. نرخ و زانیاریی بەرهەمەکان لە داتابەیسی شاخەوە بار دەکرێن.</p><a href="#products" className="mt-6 inline-flex items-center gap-2 rounded-control bg-primary px-5 py-3 font-bold text-primary-foreground hover:bg-primary-hover">بینینی بەرهەمەکان <span aria-hidden="true">←</span></a></div>
      <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary"><ShoppingBasket size={24}/></span><div><h2 className="text-xl font-black">بە پۆل بگەڕێ</h2><p className="mt-1 text-sm text-text-secondary">پۆلێک هەڵبژێرە بۆ بینینی بەرهەمەکان.</p></div></div><div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">{categoryItems.map(([value,title,Icon])=><button key={value} onClick={()=>{setCategory(value);document.getElementById("products")?.scrollIntoView({behavior:"smooth"});}} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-control border border-border p-3 text-center text-xs font-bold hover:border-primary hover:bg-secondary"><Icon size={22} className="text-primary"/>{title}</button>)}</div></div>
    </section>

    <section className="mx-auto max-w-content px-4 py-5 sm:px-6"><div className="mb-4"><h2 className="text-2xl font-black">پۆلەکان</h2><p className="mt-1 text-sm text-text-secondary">فلتەر بەپێی جۆری دوکان.</p></div><div className="flex flex-wrap gap-2">{(["all","restaurant","grocery","produce"] as Category[]).map(value=><button key={value} aria-pressed={category===value} onClick={()=>setCategory(value)} className={"rounded-control px-4 py-2 text-sm font-bold "+(category===value?"bg-primary text-primary-foreground":"border border-border bg-surface hover:bg-surface-muted")}>{labels[value]}</button>)}</div></section>

    <section id="products" className="mx-auto max-w-content px-4 py-8 sm:px-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">بەرهەمە بەردەستەکان</h2><p className="mt-1 text-sm text-text-secondary">{loading?"بەرهەمەکان بار دەکرێن...":filtered.length+" بەرهەم"}</p></div><button disabled={loading} onClick={()=>void loadProducts()} className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm font-bold hover:bg-surface-muted disabled:opacity-60"><RefreshCw size={15}/> نوێکردنەوە</button></div>
      {loading&&<div role="status" aria-live="polite" className="rounded-panel border border-border bg-surface p-8 text-center text-text-secondary">بەرهەمەکان بار دەکرێن...</div>}
      {!loading&&error&&<div role="alert" className="rounded-panel border border-danger/30 bg-surface p-6"><CircleAlert className="mb-3 text-danger"/><p>{error}</p><button onClick={()=>void loadProducts()} className="mt-3 rounded-control bg-primary px-4 py-2 font-bold text-primary-foreground">هەوڵدانەوە</button></div>}
      {!loading&&!error&&products.length===0&&<div className="rounded-panel border border-dashed border-border-strong bg-surface p-8 text-center"><Store size={30} className="mx-auto text-text-muted"/><h3 className="mt-3 font-black">هێشتا بەرهەمێک نییە</h3><p className="mt-2 text-sm leading-7 text-text-secondary">کاتێک دوکانی پەسەندکراو بەرهەم زیاد بکات و بەردەستی بکات، لێرە دەردەکەوێت.</p><Link href="/login" className="mt-4 inline-block rounded-control bg-primary px-4 py-2 font-bold text-primary-foreground">چوونەژوورەوە</Link></div>}
      {!loading&&!error&&products.length>0&&filtered.length===0&&<div className="rounded-panel border border-dashed border-border bg-surface p-8 text-center"><p>هیچ بەرهەمێک نەدۆزرایەوە.</p><button onClick={()=>{setSearch("");setCategory("all");}} className="mt-3 font-bold text-primary underline">پاککردنەوەی گەڕان</button></div>}
      {!loading&&!error&&<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(p=>{const active=cart.includes(p.id);return <article key={p.id} className="flex flex-col rounded-panel border border-border bg-surface p-5 shadow-card"><p className="text-xs text-text-muted">{p.stores.name}</p><h3 className="mt-1 text-lg font-black">{p.name}</h3><div className="mt-5 flex flex-wrap items-center justify-between gap-2"><strong className="text-xl text-primary">{money(Number(p.price_iqd))}</strong>{p.share_reward_enabled&&Number(p.share_reward_iqd)>0&&<span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-bold text-primary"><Gift size={13}/>{money(Number(p.share_reward_iqd))}</span>}</div><button aria-pressed={active} onClick={()=>{setCart(old=>active?old.filter(id=>id!==p.id):[...old,p.id]);setNotice("");}} className={"mt-4 flex items-center justify-center gap-2 rounded-control px-4 py-3 text-sm font-bold "+(active?"border border-border bg-surface-muted":"bg-primary text-primary-foreground hover:bg-primary-hover")}>{active?"لابردن لە سەبەتە":<><Plus size={16}/> زیادکردن بۆ سەبەتە</>}</button></article>;})}</div>}
    </section>

    {stores.length>0&&<section className="mx-auto max-w-content px-4 py-6 sm:px-6"><h2 className="mb-4 text-2xl font-black">دوکانە بەرهەمدارەکان</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{stores.map(p=><article key={p.store_id} className="flex items-center gap-3 rounded-panel border border-border bg-surface p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Store size={20}/></span><div><h3 className="font-bold">{p.stores.name}</h3><p className="mt-1 text-xs text-text-secondary">{labels[p.stores.category as Category]??"دوکان"}</p></div></article>)}</div></section>}

    <footer className="mt-10 border-t border-border bg-surface"><div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between"><div><b className="text-primary">شاخ</b><p className="text-xs text-text-secondary">گەیاندنی خواردن و کڕینی ڕۆژانە</p></div><a href="mailto:support@daim-post.online" className="text-sm text-text-secondary underline">پەیوەندی بە پشتگیری</a><p className="text-xs text-text-muted">© ٢٠٢٦ شاخ</p></div></footer>
    {cart.length>0&&<div className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-panel border border-border bg-surface p-4 shadow-popover"><div><p className="text-sm text-text-secondary">{cart.length} بەرهەم لە سەبەتە</p><strong className="text-lg">{money(total)}</strong></div><div className="flex gap-2"><button onClick={()=>setNotice("تەواوکردنی داواکاری هێشتا چالاک نییە؛ هیچ داواکارییەک تۆمار ناکرێت و پارەیەک وەرناگیرێت.")} className="rounded-control bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">تەواوکردنی داواکاری</button><button onClick={()=>{setCart([]);setNotice("");}} className="rounded-control border border-border px-3 py-3 text-sm font-bold">پاککردنەوە</button></div>{notice&&<p role="status" className="w-full text-sm leading-6 text-text-secondary">{notice}</p>}</div>}
  </main>;
}
