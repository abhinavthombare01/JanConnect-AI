import { Link } from 'wouter';
import { ArrowRight, CheckCircle2, Globe2, MapPin, MessageSquareText, ShieldCheck } from 'lucide-react';
import { AppShell, PageHeading, Panel, Pill } from '@/components/shell';

export default function Citizen() {
  return <AppShell>
    <PageHeading eyebrow="Citizen portal" title="Your neighborhood, in your words." description="Share a local service or infrastructure need in English, Hindi, or Marathi. It takes about two minutes." />
    <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <Panel className="overflow-hidden">
        <div className="border-b border-[#e8eee8] bg-[#f7faf6] px-6 py-5 sm:px-8"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3f1e6] text-[#287354]"><MessageSquareText size={19} /></span><div><p className="font-[Manrope] text-[15px] font-extrabold text-[#264346]">A request starts with what you see</p><p className="mt-1 text-[11px] text-[#80918a]">No formal wording needed. Describe the issue clearly.</p></div></div></div>
        <div className="grid gap-0 divide-y divide-[#edf1ed] px-6 sm:px-8">
          {[['01', 'Choose the area', 'Tell us the neighborhood or location where the need is affecting people.'], ['02', 'Describe the need', 'Write in your preferred language. Include what is happening and who is affected.'], ['03', 'Review the analysis', 'See the suggested category, urgency, and department before saving your request.']].map(([n, title, copy]) => <div key={n} className="flex gap-4 py-5"><span className="mt-0.5 font-mono text-[11px] font-bold text-[#b17a29]">{n}</span><div><h3 className="text-[13px] font-bold text-[#34514d]">{title}</h3><p className="mt-1 text-[11px] leading-[1.7] text-[#7e8f89]">{copy}</p></div></div>)}
        </div>
        <div className="px-6 pb-6 sm:px-8"><Link href="/submit" data-testid="link-citizen-start" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#17695f] px-4 py-2 text-[12px] font-bold text-white shadow-sm hover:bg-[#12594f]">Start a request <ArrowRight size={15} /></Link></div>
      </Panel>
      <div className="space-y-4">
        <Panel className="p-6"><div className="flex items-start justify-between"><div><Pill tone="green">English · हिन्दी · मराठी</Pill><h2 className="mt-4 font-[Manrope] text-[20px] font-extrabold tracking-[-.04em] text-[#264346]">Language is not a barrier.</h2></div><Globe2 size={20} className="mt-1 text-[#3d8169]" /></div><p className="mt-3 text-[12px] leading-[1.8] text-[#7b8b85]">JanConnect can classify requests written in three languages. Your original description remains attached to the saved record.</p><div className="mt-4 flex gap-2"><span className="rounded-lg bg-[#f1f6f2] px-3 py-2 text-[11px] font-medium text-[#4d6b61]">Water supply</span><span className="rounded-lg bg-[#f1f6f2] px-3 py-2 text-[11px] font-medium text-[#4d6b61]">पाणी</span><span className="rounded-lg bg-[#f1f6f2] px-3 py-2 text-[11px] font-medium text-[#4d6b61]">पाणीपुरवठा</span></div></Panel>
        <Panel className="bg-[#f3f7f1] p-6"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#33765b]" size={18} /><div><h3 className="text-[12px] font-bold text-[#34534a]">Share only what is needed</h3><p className="mt-1 text-[11px] leading-[1.7] text-[#748881]">Contact details are optional. This is a prototype, so do not include sensitive personal or health information.</p></div></div></Panel>
        <div className="flex items-center gap-3 rounded-xl border border-[#e6ece7] bg-white px-4 py-3 text-[11px] text-[#71847e]"><MapPin size={15} className="text-[#b27d30]" /> Pilot locations across Pune, Nashik, Nagpur, Mumbai, and Thane.</div>
      </div>
    </section>
    <Panel className="mt-5 flex flex-col items-start gap-3 bg-[#fffaf1] p-5 sm:flex-row sm:items-center"><CheckCircle2 size={17} className="shrink-0 text-[#a8772f]" /><p className="text-[11px] leading-relaxed text-[#786d58]">Your saved request contributes to an aggregate civic picture. Analysis is assistive and is not an official service guarantee or government response.</p></Panel>
  </AppShell>;
}