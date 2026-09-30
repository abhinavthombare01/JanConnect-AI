import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowUpRight, CalendarDays, Check, ChevronRight, CircleAlert, ClipboardList, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { getGetAnalyticsQueryKey, getGetComplaintQueryKey, getGetHotspotsQueryKey, getListComplaintsQueryKey, useGetComplaint, useListComplaints, useUpdateComplaint, type ComplaintStatus } from '@workspace/api-client-react';
import { AppShell, Button, EmptyState, ErrorNotice, LoadingBlock, PageHeading, Panel, Pill } from '@/components/shell';

const statusOptions: ComplaintStatus[] = ['New', 'Under Review', 'Action Suggested', 'Resolved'];
const categoryOptions = ['Water', 'Road', 'Transport', 'Healthcare', 'Internet'];
const priorityOptions = ['High', 'Medium', 'Low'];
const cityOptions = ['Pune', 'Nashik', 'Nagpur', 'Mumbai', 'Thane'];

function statusTone(status: string): 'neutral' | 'green' | 'amber' | 'red' | 'blue' {
  if (status === 'Resolved') return 'green';
  if (status === 'Under Review') return 'blue';
  if (status === 'Action Suggested') return 'amber';
  return 'neutral';
}

export default function Complaints() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const queryParams = {
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(category ? { category: category as 'Water' | 'Road' | 'Transport' | 'Healthcare' | 'Internet' } : {}),
    ...(priority ? { priority: priority as 'High' | 'Medium' | 'Low' } : {}),
    ...(city ? { city: city as 'Pune' | 'Nashik' | 'Nagpur' | 'Mumbai' | 'Thane' } : {}),
    ...(status ? { status: status as ComplaintStatus } : {}),
  };
  const list = useListComplaints(queryParams);
  const detail = useGetComplaint(selectedId ?? 0, { query: { enabled: selectedId !== null, queryKey: getGetComplaintQueryKey(selectedId ?? 0) } });
  const update = useUpdateComplaint();

  async function saveStatus(nextStatus: ComplaintStatus) {
    if (!selectedId) return;
    try {
      await update.mutateAsync({ id: selectedId, data: { status: nextStatus } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetComplaintQueryKey(selectedId) }),
        queryClient.invalidateQueries({ queryKey: getListComplaintsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAnalyticsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetHotspotsQueryKey() }),
      ]);
    } catch {
      // The generated mutation state renders the retry message in the detail panel.
    }
  }

  return <AppShell>
    <PageHeading eyebrow="Administrator workspace" title="Citizen requests" description="Search and review incoming needs. Update the request status as it moves through human review." action={<Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#55736b]" data-testid="link-complaints-dashboard">View aggregate insights <ArrowUpRight size={13} /></Link>} />
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[#e9eee9] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-[330px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9c95]" /><label htmlFor="requests-search" className="sr-only">Search request text and area</label><input id="requests-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests or areas…" className="h-10 w-full rounded-xl border border-[#dfe9e2] bg-white pl-9 pr-3 text-[11px] outline-none focus:border-[#4b9179] focus:ring-4 focus:ring-[#3d8d6d]/10" data-testid="input-request-search" /></div>
        <div className="flex flex-wrap items-center gap-2"><SlidersHorizontal size={14} className="mr-1 text-[#81948b]" />
          <label className="sr-only" htmlFor="filter-category">Filter by category</label><select id="filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg border border-[#dfe9e2] bg-white px-2.5 text-[10px] font-semibold text-[#58736b]" data-testid="filter-category"><option value="">All categories</option>{categoryOptions.map((x) => <option key={x}>{x}</option>)}</select>
          <label className="sr-only" htmlFor="filter-priority">Filter by priority</label><select id="filter-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 rounded-lg border border-[#dfe9e2] bg-white px-2.5 text-[10px] font-semibold text-[#58736b]" data-testid="filter-priority"><option value="">All priorities</option>{priorityOptions.map((x) => <option key={x}>{x}</option>)}</select>
          <label className="sr-only" htmlFor="filter-city">Filter by city</label><select id="filter-city" value={city} onChange={(e) => setCity(e.target.value)} className="h-9 rounded-lg border border-[#dfe9e2] bg-white px-2.5 text-[10px] font-semibold text-[#58736b]" data-testid="filter-city"><option value="">All cities</option>{cityOptions.map((x) => <option key={x}>{x}</option>)}</select>
          <label className="sr-only" htmlFor="filter-status">Filter by status</label><select id="filter-status" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-[#dfe9e2] bg-white px-2.5 text-[10px] font-semibold text-[#58736b]" data-testid="filter-status"><option value="">All statuses</option>{statusOptions.map((x) => <option key={x}>{x}</option>)}</select>
        </div>
      </div>
      <div className="flex items-center justify-between px-5 py-3 text-[10px] text-[#8a9a94]"><span>{list.data?.length ?? 0} requests found</span><span className="flex items-center gap-1"><CalendarDays size={12} /> Latest first</span></div>
      {list.isLoading ? <div className="space-y-3 p-5"><LoadingBlock /><LoadingBlock /></div> : list.isError ? <div className="p-5"><ErrorNotice message="Request records are temporarily unavailable." retry={() => list.refetch()} /></div> : list.data?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="border-y border-[#edf1ed] bg-[#fafcf9] text-[9px] font-bold uppercase tracking-[.12em] text-[#8b9b94]"><tr><th className="px-5 py-3">Request</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Status</th><th className="px-5 py-3">Created</th><th className="px-3 py-3"></th></tr></thead><tbody className="divide-y divide-[#eef2ee]">{list.data.map((item) => <tr key={item.id} tabIndex={0} aria-label={`Open request ${item.id}, ${item.summary}`} className={`cursor-pointer transition-colors hover:bg-[#f8fbf7] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4b9179] ${selectedId === item.id ? 'bg-[#f1f7f1]' : ''}`} onClick={() => setSelectedId(item.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(item.id); } }} data-testid={`row-request-${item.id}`}><td className="max-w-[330px] px-5 py-4"><div className="flex items-start gap-3"><span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eff4ef] text-[#5c8070]"><ClipboardList size={14} /></span><div className="min-w-0"><p className="line-clamp-1 text-[11px] font-bold text-[#3a5751]">{item.summary || item.complaintText}</p><p className="mt-1 line-clamp-1 text-[9px] text-[#889991]">#{item.id} · {item.language}{item.isDemo && <span className="ml-2 text-[#a16f28]">Synthetic</span>}</p></div></div></td><td className="px-4 py-4"><Pill tone="blue">{item.category}</Pill></td><td className="px-4 py-4"><Pill tone={item.priority === 'High' ? 'red' : item.priority === 'Medium' ? 'amber' : 'green'}>{item.priority}</Pill></td><td className="px-4 py-4"><div className="text-[10px] font-semibold text-[#536d65]">{item.locationName}</div><div className="mt-0.5 text-[9px] text-[#8b9b94]">{item.city}</div></td><td className="px-4 py-4"><Pill tone={statusTone(item.status)}>{item.status}</Pill></td><td className="px-5 py-4 text-[10px] text-[#7b8f86]">{new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</td><td className="px-3 py-4"><ChevronRight size={15} className="text-[#95a39b]" /></td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState title={search || category || priority || city || status ? 'No matching requests' : 'No requests yet'} detail={search || category || priority || city || status ? 'Try changing or clearing one of the filters.' : 'A saved citizen request will appear here for review.'} action={search || category || priority || city || status ? <Button variant="secondary" onClick={() => { setSearch(''); setCategory(''); setPriority(''); setCity(''); setStatus(''); }} data-testid="button-clear-filters">Clear filters</Button> : undefined} /></div>}
    </Panel>
    {selectedId !== null && <div className="fixed inset-0 z-50 flex justify-end bg-[#173a36]/25" onClick={() => setSelectedId(null)} aria-label="Close request details">
      <aside className="h-full w-full max-w-[480px] overflow-y-auto border-l border-[#dce7df] bg-[#fbfcfa] shadow-2xl" onClick={(e) => e.stopPropagation()} aria-label="Request detail panel">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e7ece7] bg-[#fbfcfa]/95 px-5 py-4 backdrop-blur"><div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#a67936]">Request detail</p><p className="mt-1 text-[12px] font-extrabold text-[#31504a]">Record #{selectedId}</p></div><button onClick={() => setSelectedId(null)} className="rounded-lg p-2 text-[#688178] hover:bg-[#eef3ee]" aria-label="Close details" data-testid="button-close-request"><X size={17} /></button></div>
        {detail.isLoading ? <div className="p-5"><LoadingBlock label="Loading request details" /></div> : detail.isError || !detail.data ? <div className="p-5"><ErrorNotice message="This request detail could not be loaded." retry={() => detail.refetch()} /></div> : <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2"><Pill tone="blue">{detail.data.category}</Pill><Pill tone={detail.data.priority === 'High' ? 'red' : detail.data.priority === 'Medium' ? 'amber' : 'green'}>{detail.data.priority} priority</Pill>{detail.data.isDemo && <Pill tone="amber">Synthetic record</Pill>}</div>
          <div><h2 className="font-[Manrope] text-[19px] font-extrabold leading-tight tracking-[-.04em] text-[#244044]">{detail.data.summary}</h2><p className="mt-3 text-[11px] leading-[1.8] text-[#70847b]">{detail.data.complaintText}</p></div>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[#f1f6f1] p-3"><p className="text-[9px] text-[#87978f]">Location</p><p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#47635b]"><MapPin size={12} />{detail.data.locationName}</p></div><div className="rounded-xl bg-[#f1f6f1] p-3"><p className="text-[9px] text-[#87978f]">Affected group</p><p className="mt-1 text-[10px] font-bold text-[#47635b]">{detail.data.affectedGroup}</p></div><div className="rounded-xl bg-[#f1f6f1] p-3"><p className="text-[9px] text-[#87978f]">Language</p><p className="mt-1 text-[10px] font-bold text-[#47635b]">{detail.data.language}</p></div><div className="rounded-xl bg-[#f1f6f1] p-3"><p className="text-[9px] text-[#87978f]">Confidence</p><p className="mt-1 text-[10px] font-bold text-[#47635b]">{Math.round(detail.data.confidence * 100)}%</p></div></div>
          <div className="rounded-xl border border-[#eadfc8] bg-[#fffaf0] p-4"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#a2793b]">Why this priority</p><p className="mt-2 text-[11px] leading-[1.7] text-[#776b54]">{detail.data.priorityReason}</p></div>
          <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#86968e]">Recommended department</p><p className="mt-1 text-[11px] font-bold text-[#426057]">{detail.data.recommendedDepartment}</p><p className="mt-2 text-[11px] leading-[1.7] text-[#71857d]">{detail.data.recommendedAction}</p></div>
          <div className="border-t border-[#e7ece7] pt-4"><label htmlFor="request-status" className="mb-2 block text-[10px] font-bold text-[#557067]">Review status</label><div className="flex gap-2"><select id="request-status" defaultValue={detail.data.status} className="h-10 min-w-0 flex-1 rounded-lg border border-[#dce7df] bg-white px-2 text-[10px] text-[#46635b]" data-testid="select-request-status">{statusOptions.map((option) => <option key={option}>{option}</option>)}</select><Button disabled={update.isPending} onClick={() => { const el = document.getElementById('request-status') as HTMLSelectElement | null; if (el) void saveStatus(el.value as ComplaintStatus); }} data-testid="button-save-status">{update.isPending ? 'Saving…' : <><Check size={13} /> Save status</>}</Button></div>{update.isError && <p role="alert" className="mt-2 flex items-center gap-1 text-[10px] text-[#a94e43]"><CircleAlert size={12} /> Status could not be updated. Try again.</p>}</div>
          <p className="text-[9px] leading-relaxed text-[#98a39d]">Created {new Date(detail.data.createdAt).toLocaleString()} · Contact information is restricted to this request detail.</p>
        </div>}
      </aside>
    </div>}
  </AppShell>;
}