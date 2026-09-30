import { Link, useLocation } from 'wouter';
import { Activity, ArrowUpRight, BarChart3, Building2, CircleHelp, ClipboardList, Compass, Home, MapPinned, Menu, MessageSquareText, ShieldCheck, X } from 'lucide-react';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

const navigation = [
  { href: '/', label: 'Overview', icon: Home },
  { href: '/citizen', label: 'Citizen portal', icon: MessageSquareText },
  { href: '/dashboard', label: 'Insights', icon: BarChart3 },
  { href: '/complaints', label: 'Requests', icon: ClipboardList },
  { href: '/map', label: 'Demand map', icon: MapPinned },
  { href: '/about', label: 'About this prototype', icon: CircleHelp },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" data-testid="link-brand-home" aria-label="JanConnect AI home">
      <span className="relative grid h-10 w-10 place-items-center rounded-[13px] bg-[#dceee6] text-[#17685d]">
        <span className="absolute h-[2px] w-5 -rotate-45 rounded-full bg-current" />
        <span className="absolute h-5 w-[2px] rotate-45 rounded-full bg-current" />
        <span className="absolute h-2 w-2 rounded-full border-2 border-current bg-[#dceee6]" />
      </span>
      {!compact && <span className="leading-tight"><span className="block font-[Manrope] text-[16px] font-extrabold tracking-[-.045em]">JanConnect <span className="text-[#bc7a25]">AI</span></span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">Civic intelligence</span></span>}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = location || '/';
  const sidebar = (
    <>
      <div className="flex items-center justify-between px-6 pb-8 pt-7">
        <BrandMark />
        <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-white/65 hover:bg-white/10 md:hidden" aria-label="Close navigation" data-testid="button-close-navigation"><X size={18} /></button>
      </div>
      <div className="px-4">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.17em] text-[#8ca9a5]">Workspace</p>
        <nav aria-label="Primary navigation" className="space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`sidebar-link flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold ${active ? 'bg-[#dceee6] text-[#155f55] shadow-sm' : 'text-[#d1e0dd] hover:bg-white/10 hover:text-white'}`}><Icon size={17} strokeWidth={1.9} /><span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#bd7b28]" />}</Link>;
          })}
        </nav>
      </div>
      <div className="mt-auto px-4 pb-5">
        <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4">
          <div className="mb-3 flex items-center gap-2 text-[#a9d9c4]"><ShieldCheck size={16} /><span className="text-[11px] font-bold uppercase tracking-[.1em]">Prototype mode</span></div>
          <p className="text-[11px] leading-[1.55] text-[#b1c7c3]">Insights support planning conversations. They do not replace official review.</p>
          <Link href="/about" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white hover:text-[#a9d9c4]" data-testid="link-prototype-disclaimer">Read the disclaimer <ArrowUpRight size={12} /></Link>
        </div>
        <div className="mt-5 flex items-center gap-2 px-2 text-[10px] text-[#8ca9a5]"><span className="h-1.5 w-1.5 rounded-full bg-[#78c29e]" /> JanConnect AI · Maharashtra pilot</div>
      </div>
    </>
  );
  return (
    <div className="app-shell bg-[#f5f7f4]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-[#183c40] text-white md:flex">{sidebar}</aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-[#0f2729]/45 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col bg-[#183c40] text-white transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</aside>
      <div className="min-h-[100dvh] md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e7ece7] bg-[#f8faf7]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-[#e0e9e3] bg-white p-2.5 text-[#31595a] shadow-sm md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)} data-testid="button-open-navigation"><Menu size={18} /></button>
            <div className="hidden items-center gap-2 text-[12px] text-[#78908b] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#d18e35]" /> Civic requests, understood together</div>
            <div className="flex items-center gap-2 sm:hidden"><BrandMark compact /><span className="text-[14px] font-extrabold tracking-[-.04em]">JanConnect <span className="text-[#bc7a25]">AI</span></span></div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#e1eae4] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#56726d] sm:flex"><Activity size={13} className="text-[#23805f]" /> Service active</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e5eee8] text-[#386a5c]"><Building2 size={15} /></span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1510px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <div className="page-enter">{children}</div>
          <footer className="mt-12 flex flex-col gap-2 border-t border-[#e2eae4] py-5 text-[10px] text-[#85948e] sm:flex-row sm:items-center sm:justify-between">
            <span>From Citizen Voices to Smarter Infrastructure Decisions</span>
            <span>Prototype · Synthetic records are labeled</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#ac792f]">{eyebrow || 'JanConnect AI'}</p><h1 className="font-[Manrope] text-[27px] font-extrabold leading-tight tracking-[-.055em] text-[#1b3538] sm:text-[34px]" data-testid="text-page-title">{title}</h1>{description && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#6e817d]">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</div>;
}

export function Panel({ children, className = '', ...props }: { children: ReactNode; className?: string; [key: string]: any }) {
  return <section className={`rounded-2xl border border-[#e5ebe6] bg-white shadow-[0_4px_18px_rgba(29,62,56,.045)] ${className}`} {...props}>{children}</section>;
}

export function PanelTitle({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6"><div><h2 className="font-[Manrope] text-[15px] font-extrabold tracking-[-.025em] text-[#244044]">{title}</h2>{note && <p className="mt-1 text-[11px] leading-relaxed text-[#81928e]">{note}</p>}</div>{action}</div>;
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' }) {
  const styles = { primary: 'bg-[#17695f] text-white shadow-[0_4px_10px_rgba(23,105,95,.17)] hover:bg-[#12594f]', secondary: 'border border-[#dce8e1] bg-white text-[#315b55] hover:bg-[#f4f8f4]', quiet: 'text-[#57746d] hover:bg-[#edf4ef]', danger: 'bg-[#a94c43] text-white hover:bg-[#913e37]' };
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' }) {
  const styles = { neutral: 'bg-[#eff3f0] text-[#59716a]', green: 'bg-[#e3f3e8] text-[#28724e]', amber: 'bg-[#fff1d9] text-[#9a6616]', red: 'bg-[#fae8e5] text-[#a94e43]', blue: 'bg-[#e7f0f4] text-[#477187]' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold leading-none ${styles[tone]}`}>{children}</span>;
}

export function LoadingBlock({ label = 'Loading civic data' }: { label?: string }) {
  return <div role="status" aria-label={label} className="space-y-3 rounded-2xl border border-[#e6ece7] bg-white p-6"><span className="sr-only">{label}</span><div className="skeleton h-4 w-1/3 rounded-md" /><div className="skeleton h-8 w-2/3 rounded-md" /><div className="skeleton h-24 rounded-xl" /></div>;
}

export function ErrorNotice({ message = 'We could not load this information.', retry }: { message?: string; retry?: () => void }) {
  return <div role="alert" className="rounded-2xl border border-[#f0d9d3] bg-[#fff9f7] p-5"><p className="text-sm font-bold text-[#8c4339]">Something needs another try</p><p className="mt-1 text-xs text-[#956e67]">{message}</p>{retry && <Button variant="secondary" className="mt-3 min-h-8 px-3" onClick={retry} data-testid="button-retry">Try again</Button>}</div>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="flex min-h-[190px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfded4] bg-[#f9fbf8] px-5 py-8 text-center"><span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#e5f1e8] text-[#34765a]"><Compass size={18} /></span><p className="font-[Manrope] text-sm font-extrabold text-[#31514c]">{title}</p><p className="mt-1 max-w-sm text-xs leading-relaxed text-[#80918a]">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function StatCard({ label, value, note, accent = 'mint', icon: Icon }: { label: string; value: string | number; note?: string; accent?: 'mint' | 'saffron' | 'sky' | 'rose'; icon: typeof Activity }) {
  const accents = { mint: 'bg-[#e5f2e9] text-[#277255]', saffron: 'bg-[#fff1d9] text-[#aa7324]', sky: 'bg-[#e8f0f4] text-[#4b7688]', rose: 'bg-[#f9e9e5] text-[#ad5a4c]' };
  return <Panel className="p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold text-[#7e918a]">{label}</p><p className="mt-3 font-[Manrope] text-[29px] font-extrabold leading-none tracking-[-.06em] text-[#1e3d3d]" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</p>{note && <p className="mt-2 text-[10px] text-[#899a94]">{note}</p>}</div><span className={`grid h-10 w-10 place-items-center rounded-xl ${accents[accent]}`}><Icon size={18} /></span></div></Panel>;
}