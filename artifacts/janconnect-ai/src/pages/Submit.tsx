import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Check, CircleAlert, Clock3, FileCheck2, Languages, LoaderCircle, MapPin, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { getGetAnalyticsQueryKey, getGetHotspotsQueryKey, getListComplaintsQueryKey, useCreateComplaint, type Complaint, type ComplaintInput, type Language } from '@workspace/api-client-react';
import { AppShell, Button, PageHeading, Panel, Pill } from '@/components/shell';

const locationOptions = ['Hadapsar, Pune', 'Kothrud, Pune', 'Pimpri, Pune', 'Nashik Road, Nashik', 'Central Nashik', 'Nagpur Central', 'Mumbai Suburbs', 'Thane'];

export default function Submit() {
  const queryClient = useQueryClient();
  const create = useCreateComplaint();
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<Language>('English');
  const [locationName, setLocationName] = useState('Hadapsar, Pune');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [result, setResult] = useState<Complaint | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    const data = {
      complaintText: text.trim(),
      language,
      locationName: locationName as ComplaintInput['locationName'],
    };
    try {
      const saved = await create.mutateAsync({ data: { ...data, contactName: contactName.trim() || undefined, contactPhone: contactPhone.trim() || undefined } });
      setResult(saved);
      setText('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAnalyticsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetHotspotsQueryKey() }),
      ]);
    } catch {
      setError('We could not save this request just now. Please check your connection and try again.');
    }
  }
  const pending = create.isPending;
  return <AppShell>
    <PageHeading eyebrow="Citizen portal / New request" title="Tell us what your area needs." description="A short, specific description helps the analysis identify the issue and the people it affects." action={<Link href="/citizen" className="inline-flex items-center gap-2 text-[11px] font-bold text-[#58746d]" data-testid="link-back-citizen"><ArrowLeft size={14} /> Citizen portal</Link>} />
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(270px,.7fr)]">
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#e9eee9] bg-[#f8faf7] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f1e8] text-[#277256]"><FileCheck2 size={17} /></span><div><p className="text-[13px] font-extrabold text-[#34504c]">Request details</p><p className="text-[10px] text-[#8a9b94]">Fields marked required must be completed</p></div></div><Pill tone="blue">Usually 2 min</Pill></div>
        <form className="space-y-5 p-5 sm:p-7" onSubmit={handleSubmit}>
          <div><label htmlFor="request-description" className="mb-2 block text-[11px] font-bold text-[#3d5c56]">What is happening in your area? <span className="text-[#b65549]">*</span></label><textarea id="request-description" value={text} onChange={(event) => setText(event.target.value)} minLength={6} maxLength={2000} required rows={6} placeholder="For example: The water supply has been irregular on our street for the past two weeks, especially in the mornings…" className="w-full resize-y rounded-xl border border-[#dce7df] bg-[#fcfdfb] px-4 py-3 text-[13px] leading-[1.7] text-[#284441] outline-none transition focus:border-[#489178] focus:ring-4 focus:ring-[#3d8d6d]/10" data-testid="input-request-description" /><div className="mt-2 flex justify-between text-[10px] text-[#8b9a94]"><span>Include the location and who is affected, if you can.</span><span>{text.length}/2000</span></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="request-language" className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[#3d5c56]"><Languages size={13} /> Language</label><select id="request-language" value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="h-11 w-full rounded-xl border border-[#dce7df] bg-white px-3 text-[12px] text-[#365750] outline-none focus:border-[#489178] focus:ring-4 focus:ring-[#3d8d6d]/10" data-testid="select-request-language"><option>English</option><option>Hindi</option><option>Marathi</option></select></div>
            <div><label htmlFor="request-location" className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[#3d5c56]"><MapPin size={13} /> Area or location</label><select id="request-location" value={locationName} onChange={(event) => setLocationName(event.target.value)} className="h-11 w-full rounded-xl border border-[#dce7df] bg-white px-3 text-[12px] text-[#365750] outline-none focus:border-[#489178] focus:ring-4 focus:ring-[#3d8d6d]/10" data-testid="select-request-location">{locationOptions.map((place) => <option key={place}>{place}</option>)}</select></div>
          </div>
          <details className="rounded-xl border border-[#e7eee8] bg-[#fbfcfa] px-4 py-3"><summary className="cursor-pointer text-[11px] font-bold text-[#58736b]">Optional contact details</summary><p className="mt-1 text-[10px] text-[#8b9993]">Leave these blank if you prefer not to share contact information.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><label htmlFor="contact-name" className="mb-1.5 block text-[10px] font-semibold text-[#61776f]">Name</label><input id="contact-name" value={contactName} onChange={(event) => setContactName(event.target.value)} maxLength={100} className="h-10 w-full rounded-lg border border-[#dce7df] bg-white px-3 text-[12px] outline-none focus:border-[#489178]" data-testid="input-contact-name" /></div><div><label htmlFor="contact-phone" className="mb-1.5 block text-[10px] font-semibold text-[#61776f]">Phone number</label><input id="contact-phone" type="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} maxLength={40} className="h-10 w-full rounded-lg border border-[#dce7df] bg-white px-3 text-[12px] outline-none focus:border-[#489178]" data-testid="input-contact-phone" /></div></div></details>
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-[#f1d7d2] bg-[#fff7f5] p-3 text-[11px] leading-relaxed text-[#984e43]" data-testid="status-submit-error"><CircleAlert size={15} className="mt-0.5 shrink-0" />{error}</div>}
           <div className="flex flex-col gap-3 border-t border-[#edf1ed] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-1.5 text-[10px] text-[#84938d]"><ShieldCheck size={13} /> Please do not include sensitive personal information.</p><Button type="submit" disabled={pending || text.trim().length < 6} className="min-h-11" data-testid="button-analyze-save">{pending ? <><LoaderCircle size={15} className="animate-spin" /> Analyzing and saving…</> : <>Analyze and save <Send size={14} /></>}</Button></div>
        </form>
      </Panel>
      <aside className="space-y-4">
         {result ? <Panel className="overflow-hidden" data-testid="card-saved-analysis"><div className="border-b border-[#e7eee8] bg-[#eff7ef] px-5 py-4"><div className="flex items-center gap-2 text-[#277451]"><Check size={16} /><span className="text-[12px] font-extrabold">Request saved</span></div><p className="mt-1 text-[10px] text-[#728a7b]">Reference #{result.id} · {result.locationName}</p></div><div className="space-y-4 p-5"><div className="flex flex-wrap gap-2"><Pill tone="blue">{result.category}</Pill><Pill tone={result.priority === 'High' ? 'red' : result.priority === 'Medium' ? 'amber' : 'green'}>{result.priority} priority</Pill>{typeof result.usedFallback === 'boolean' && <Pill tone={result.usedFallback ? 'amber' : 'green'}>{result.usedFallback ? 'Keyword fallback' : 'AI-assisted'}</Pill>}</div><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#91a098]">Summary</p><p className="mt-1 text-[12px] leading-[1.7] text-[#47615c]">{result.summary}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#91a098]">Suggested next step</p><p className="mt-1 text-[11px] leading-[1.7] text-[#47615c]">{result.recommendedAction}</p></div><div className="rounded-xl bg-[#f5f8f4] p-3"><p className="text-[10px] text-[#7a8e84]">Recommended department</p><p className="mt-1 text-[11px] font-bold text-[#34544d]">{result.recommendedDepartment}</p></div><div className="flex items-center gap-2 border-t border-[#edf1ed] pt-3 text-[10px] text-[#84938d]"><Clock3 size={13} /> Status: {result.status}</div></div></Panel> : <Panel className="bg-[#f8faf6] p-5"><div className="flex items-center gap-2 text-[#a8762d]"><Sparkles size={16} /><p className="text-[12px] font-extrabold text-[#3d5b52]">What happens next</p></div><ol className="mt-4 space-y-3">{['Your description is reviewed for issue type and urgency.', 'A concise summary and department suggestion are prepared.', 'The saved request joins an aggregate view for civic teams.'].map((item, i) => <li key={item} className="flex gap-3 text-[11px] leading-[1.6] text-[#748780]"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[9px] font-bold text-[#9b6e2d] shadow-sm">{i + 1}</span>{item}</li>)}</ol></Panel>}
         <Panel className="p-5"><h3 className="text-[11px] font-bold text-[#3f5d56]">A note on this prototype</h3><p className="mt-2 text-[10px] leading-[1.7] text-[#82928c]">This is a demonstration, not an official complaint channel. When AI is enabled, request text, language, and area go to OpenAI for classification; optional contact details are not sent to the AI provider. Analysis may be imperfect and needs human review.</p><Link href="/about" className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#17695f]" data-testid="link-submit-privacy">Privacy and prototype details <ArrowRight size={12} /></Link></Panel>
      </aside>
    </div>
  </AppShell>;
}