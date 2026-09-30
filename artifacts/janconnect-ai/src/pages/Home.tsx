import { Link } from 'wouter';
import { ArrowRight, ArrowUpRight, BarChart3, CircleDot, Globe2, MapPinned, MessageSquareText, ShieldCheck, Sparkles, UsersRound, Waves } from 'lucide-react';
import { useHealthCheck, useListComplaints } from '@workspace/api-client-react';
import { AppShell, Panel, Pill } from '@/components/shell';

export default function Home() {
  const health = useHealthCheck();
  const requests = useListComplaints();
  const total = requests.data?.length;
  return <AppShell>
    <section className="relative overflow-hidden rounded-[26px] bg-[#1b4546] px-6 py-9 text-white shadow-[0_18px_44px_rgba(26,66,62,.15)] sm:px-10 sm:py-12 lg:px-14 lg:py-[58px]">
      <div className="absolute -right-20 -top-24 h-[360px] w-[360px] rounded-full border border-white/[.08]" /><div className="absolute -right-3 -top-7 h-[230px] w-[230px] rounded-full border border-white/[.09]" /><div className="absolute right-[11%] top-[25%] hidden h-28 w-28 rotate-45 border border-[#a4c8b4]/30 md:block" />
      <div className="relative max-w-[780px]">
        <Pill tone="green"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#2c865f]" /> Civic intelligence for Maharashtra</Pill>
        <h1 className="mt-6 max-w-[760px] font-[Manrope] text-[38px] font-extrabold leading-[1.07] tracking-[-.065em] sm:text-[54px] lg:text-[65px]">Everyday needs.<br /><span className="text-[#b6d9c2]">Better public decisions.</span></h1>
        <p className="mt-5 max-w-[550px] text-[14px] leading-[1.8] text-[#d0e1d9] sm:text-[16px]">A clear way for people to share local infrastructure needs — and a sharper view for teams deciding what to address next.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/citizen" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e6b15f] px-5 text-[13px] font-extrabold text-[#27403a] transition-colors hover:bg-[#f0c47d]" data-testid="link-start-citizen"><MessageSquareText size={16} /> Share a local need <ArrowRight size={16} /></Link>
          <Link href="/dashboard" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-[13px] font-bold text-white transition-colors hover:bg-white/10" data-testid="link-explore-dashboard">Explore admin insights <ArrowUpRight size={15} /></Link>
        </div>
        <p className="mt-5 text-[10px] text-[#afc8bd]">From Citizen Voices to Smarter Infrastructure Decisions</p>
      </div>
      <div className="relative mt-10 grid max-w-[660px] grid-cols-3 gap-2 border-t border-white/15 pt-5 sm:mt-12 sm:gap-6">
        <div><p className="font-[Manrope] text-xl font-extrabold">{requests.isLoading ? '—' : total ?? '—'}</p><p className="mt-1 text-[10px] text-[#b7cdc3]">Requests in this view</p></div>
        <div><p className="font-[Manrope] text-xl font-extrabold">3</p><p className="mt-1 text-[10px] text-[#b7cdc3]">Languages supported</p></div>
        <div><p className="font-[Manrope] text-xl font-extrabold">5</p><p className="mt-1 text-[10px] text-[#b7cdc3]">Pilot cities</p></div>
      </div>
    </section>

    <section className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
      <div className="max-w-md">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ac792f]">One shared picture</p>
        <h2 className="mt-3 font-[Manrope] text-[29px] font-extrabold leading-[1.16] tracking-[-.055em] text-[#1f3c3d] sm:text-[37px]">A local signal,<br />made useful.</h2>
        <p className="mt-4 text-[13px] leading-[1.85] text-[#748782]">When concerns are heard in the language people use every day, patterns become easier to see. JanConnect turns individual requests into an organized starting point for civic review.</p>
        <Link href="/about" className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold text-[#17695f] hover:text-[#9b6928]" data-testid="link-how-it-works">How the prototype works <ArrowRight size={14} /></Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { icon: Globe2, title: 'Speak your language', copy: 'Share a need in English, Hindi, or Marathi without changing how you naturally describe it.', color: 'text-[#26735b]', bg: 'bg-[#e5f1e8]' },
          { icon: CircleDot, title: 'Find the common thread', copy: 'Requests are grouped by issue, urgency, and area so recurring demand is easier to spot.', color: 'text-[#aa7324]', bg: 'bg-[#fff1da]' },
          { icon: MapPinned, title: 'See where needs gather', copy: 'A geographic view helps administrators compare requests across neighborhoods and cities.', color: 'text-[#4e7888]', bg: 'bg-[#e7f0f3]' },
          { icon: ShieldCheck, title: 'Keep people in view', copy: 'Human review stays central. Recommendations are planning cues, not automated decisions.', color: 'text-[#a75246]', bg: 'bg-[#f9e9e5]' },
        ].map(({ icon: Icon, title, copy, color, bg }) => <Panel key={title} className="p-5 sm:p-6"><span className={`grid h-10 w-10 place-items-center rounded-xl ${bg} ${color}`}><Icon size={18} /></span><h3 className="mt-4 font-[Manrope] text-[14px] font-extrabold text-[#244044]">{title}</h3><p className="mt-2 text-[11px] leading-[1.7] text-[#7a8b86]">{copy}</p></Panel>)}
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.08fr_.92fr]">
      <Panel className="overflow-hidden">
        <div className="p-6 sm:p-8"><div className="flex items-center justify-between"><Pill tone="blue">For administrators</Pill><BarChart3 size={18} className="text-[#62827b]" /></div><h2 className="mt-5 max-w-md font-[Manrope] text-[25px] font-extrabold leading-tight tracking-[-.045em] text-[#244044]">Move from a queue of requests to a picture of demand.</h2><p className="mt-3 max-w-lg text-[12px] leading-[1.8] text-[#788984]">Scan categories, urgency, places, and generated planning insights in one focused workspace.</p><Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold text-[#17695f]" data-testid="link-open-insights">Open the insights desk <ArrowRight size={14} /></Link></div>
        <div className="border-t border-[#e7ede8] bg-[#f7faf7] px-6 py-5 sm:px-8"><div className="flex flex-wrap items-center gap-5 text-[10px] font-semibold text-[#6f837d]"><span className="flex items-center gap-1.5"><Sparkles size={13} className="text-[#b17c2b]" /> AI-assisted categorization</span><span className="flex items-center gap-1.5"><UsersRound size={13} className="text-[#32745b]" /> Human-reviewed next steps</span><span className="flex items-center gap-1.5"><Waves size={13} className="text-[#4a7b88]" /> Demand by area</span></div></div>
      </Panel>
      <Panel className="flex flex-col justify-between bg-[#f5f8f3] p-6 sm:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ac792f]">Built for a pilot</p><h2 className="mt-3 font-[Manrope] text-[24px] font-extrabold leading-tight tracking-[-.045em] text-[#244044]">Start with one place you know.</h2><p className="mt-3 text-[12px] leading-[1.8] text-[#788984]">Choose your area, describe what is needed, and review the analysis before saving your request.</p></div><Link href="/submit" className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-[#17695f] px-4 py-3 text-[11px] font-bold text-white shadow-sm hover:bg-[#12594f]" data-testid="link-submit-request">Make a request <ArrowRight size={14} /></Link><p className="mt-5 border-t border-[#e1e9e0] pt-4 text-[10px] text-[#87968e]">{health.isError ? 'Service status unavailable' : health.isLoading ? 'Checking service status…' : 'Prototype service ready'} · {requests.data?.some((r) => r.isDemo) ? 'Contains clearly labeled synthetic records' : 'Prototype data only'}</p></Panel>
    </section>
  </AppShell>;
}