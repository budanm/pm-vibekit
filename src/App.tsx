
import React, { useEffect, useMemo, useState } from "react";

// PM VibeKit — a tiny, useful, and show-off-able PM toolbox
// Features in this MVP:
// 1) Prioritization with RICE + ICE scoring (sortable, editable, persistent)
// 2) Export to Markdown & CSV (copy or download)
// 3) PRD Generator (fill a form → export Markdown)
// No backend required. Tailwind styling. Perfect for a quick GitHub repo.

// ------------------ Types ------------------

type Item = {
  id: string;
  title: string;
  owner: string;
  reach: number; // per time period
  impact: number; // 0.25, 0.5, 1, 2, 3
  confidence: number; // 0..100
  effort: number; // person-months or story points
};

// ------------------ Helpers ------------------

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function riceScore(i: Item) {
  const c = Math.max(0, Math.min(100, i.confidence)) / 100;
  const e = Math.max(0.0001, i.effort);
  return (i.reach * i.impact * c) / e;
}

function iceScore(i: Item) {
  const c = Math.max(0, Math.min(100, i.confidence)) / 100;
  return (i.impact * c) / Math.max(0.0001, i.effort);
}

function toCSV(items: Item[], scoreMode: "RICE" | "ICE") {
  const header = ["Title","Owner","Reach","Impact","Confidence","Effort",scoreMode].join(",");
  const rows = items.map(i => [
    quote(i.title),
    quote(i.owner),
    i.reach,
    i.impact,
    i.confidence,
    i.effort,
    scoreMode === "RICE" ? riceScore(i).toFixed(2) : iceScore(i).toFixed(2)
  ].join(","));
  return [header, ...rows].join("\n");
}

function quote(s: string) {
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}

function downloadBlob(content: string, name: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------------ Root ------------------

export default function PMVibeKit() {
  const [tab, setTab] = useState<"prioritize" | "prd">("prioritize");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-zinc-900 text-slate-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <header className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">PM VibeKit</h1>
          <nav className="flex gap-2">
            <TabButton active={tab === "prioritize"} onClick={() => setTab("prioritize")}>Prioritize</TabButton>
            <TabButton active={tab === "prd"} onClick={() => setTab("prd")}>PRD Generator</TabButton>
            <a className="px-3 py-2 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10" href="https://github.com/new" target="_blank" rel="noreferrer">Create GitHub Repo →</a>
          </nav>
        </header>

        {tab === "prioritize" ? <Prioritize /> : <PRDGenerator />}

        <footer className="mt-8 text-center text-xs text-slate-400">Built during a vibe-coding session ✨ — No backend, local‑first.</footer>
      </div>
    </div>
  );
}

function TabButton({ active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={`px-3 py-2 rounded-2xl text-sm border transition ${active ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
    />
  );
}

// ------------------ Prioritization ------------------

function Prioritize() {
  const [items, setItems] = useState<Item[]>(() => {
    const raw = localStorage.getItem("pm-vibekit-items");
    if (raw) {
      try { return JSON.parse(raw) as Item[]; } catch {}
    }
    // Inside function Prioritize() default state:
    return [
      { id: uid(), title: "Dark mode support",   owner: "You", reach: 200, impact: 2, confidence: 80, effort: 2 },
      { id: uid(), title: "Global search bar",   owner: "You", reach: 120, impact: 2, confidence: 85, effort: 1 }
    ];
  });
  const [mode, setMode] = useState<"RICE" | "ICE">("RICE");
  const [sortKey, setSortKey] = useState<"score" | "title" | "owner">("score");

  useEffect(() => {
    localStorage.setItem("pm-vibekit-items", JSON.stringify(items));
  }, [items]);

  const scored = useMemo(() => {
    const addScore = (i: Item) => ({
      ...i,
      score: mode === "RICE" ? riceScore(i) : iceScore(i)
    });
    const list = items.map(addScore);
    if (sortKey === "title") return list.sort((a,b)=>a.title.localeCompare(b.title));
    if (sortKey === "owner") return list.sort((a,b)=>a.owner.localeCompare(b.owner));
    return list.sort((a,b)=>b.score - a.score);
  }, [items, mode, sortKey]);

  const addRow = () => setItems(prev => [...prev, { id: uid(), title: "", owner: "", reach: 100, impact: 1, confidence: 80, effort: 1 }]);
  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const update = (id: string, patch: Partial<Item>) => setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  const exportMD = () => {
    const lines = [
      `# Prioritization (${mode})`,
      "",
      `| # | Title | Owner | Reach | Impact | Confidence | Effort | `+mode+` |`,
      `|---:|---|---|---:|---:|---:|---:|---:|`,
      ...scored.map((i, idx) => `| ${idx+1} | ${i.title || "-"} | ${i.owner || "-"} | ${i.reach} | ${i.impact} | ${i.confidence}% | ${i.effort} | ${i.score.toFixed(2)} |`)
    ];
    const md = lines.join("\n");
    downloadBlob(md, `prioritization-${mode.toLowerCase()}.md`, "text/markdown;charset=utf-8");
  };

  const exportCSV = () => {
    const csv = toCSV(scored as any, mode);
    downloadBlob(csv, `prioritization-${mode.toLowerCase()}.csv`, "text/csv;charset=utf-8");
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data)) setItems(data);
      } catch {}
    };
    reader.readAsText(file);
    (e.currentTarget as HTMLInputElement).value = "";
  };

  const exportJSON = () => downloadBlob(JSON.stringify(items, null, 2), "prioritization.json", "application/json");

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-slate-300">Scoring:</label>
          <select value={mode} onChange={e=>setMode(e.target.value as any)} className="bg-white/10 border border-white/10 rounded-2xl px-3 py-2 text-sm">
            <option>RICE</option>
            <option>ICE</option>
          </select>
          <label className="text-sm text-slate-300 ml-4">Sort by:</label>
          <select value={sortKey} onChange={e=>setSortKey(e.target.value as any)} className="bg-white/10 border border-white/10 rounded-2xl px-3 py-2 text-sm">
            <option value="score">Score</option>
            <option value="title">Title</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={addRow} className="px-3 py-2 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10">+ Add item</button>
          <button onClick={exportMD} className="px-3 py-2 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10">Export Markdown</button>
          <button onClick={exportCSV} className="px-3 py-2 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10">Export CSV</button>
          <button onClick={exportJSON} className="px-3 py-2 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10">Backup JSON</button>
          <label className="px-3 py-2 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer">Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left">
            <tr>
              <Th>#</Th>
              <Th>Title</Th>
              <Th>Owner</Th>
              <Th className="text-right">Reach</Th>
              <Th className="text-right">Impact</Th>
              <Th className="text-right">Confidence</Th>
              <Th className="text-right">Effort</Th>
              <Th className="text-right">Score</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {scored.map((i, idx) => (
              <tr key={i.id} className="border-t border-white/10 hover:bg-white/5">
                <Td>{idx+1}</Td>
                <Td>
                  <input value={i.title} onChange={e=>update(i.id,{title:e.target.value})} placeholder="Feature name" className="w-full bg-transparent outline-none" />
                </Td>
                <Td>
                  <input value={i.owner} onChange={e=>update(i.id,{owner:e.target.value})} placeholder="Owner" className="w-full bg-transparent outline-none" />
                </Td>
                <Td alignRight>
                  <NumberInput value={i.reach} onChange={v=>update(i.id,{reach:v})} min={0} />
                </Td>
                <Td alignRight>
                  <select value={i.impact} onChange={e=>update(i.id,{impact:parseFloat(e.target.value)})} className="bg-transparent">
                    {[0.25,0.5,1,2,3].map(v=> <option key={v} value={v}>{v}</option>)}
                  </select>
                </Td>
                <Td alignRight>
                  <div className="flex items-center gap-2 justify-end">
                    <input type="range" min={0} max={100} value={i.confidence} onChange={e=>update(i.id,{confidence:parseInt(e.target.value)})} />
                    <span className="tabular-nums w-10 text-right">{i.confidence}%</span>
                  </div>
                </Td>
                <Td alignRight>
                  <NumberInput value={i.effort} onChange={v=>update(i.id,{effort:v})} min={0.1} step={0.1} />
                </Td>
                <Td alignRight>
                  <span className="font-semibold tabular-nums">{i.score.toFixed(2)}</span>
                </Td>
                <Td>
                  <button onClick={()=>remove(i.id)} className="px-2 py-1 rounded-lg text-xs border bg-white/5 border-white/10 hover:bg-white/10">Delete</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">Tip: RICE = (Reach × Impact × Confidence) / Effort. Impact scale: 0.25 (minimal), 0.5 (low), 1 (medium), 2 (high), 3 (massive).</p>
    </section>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <th className={`px-3 py-2 font-semibold ${className}`}>{children}</th>;
}
function Td({ children, alignRight }: { children: React.ReactNode, alignRight?: boolean }) {
  return <td className={`px-3 py-2 ${alignRight ? "text-right" : ""}`}>{children}</td>;
}

function NumberInput({ value, onChange, min = 0, step = 1 }: { value: number, onChange: (n:number)=>void, min?: number, step?: number }) {
  return (
    <input type="number" value={value} onChange={e=>onChange(parseFloat(e.target.value || "0"))} min={min} step={step} className="w-24 bg-transparent text-right" />
  );
}

// ------------------ PRD Generator ------------------

function PRDGenerator() {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [problem, setProblem] = useState("");
  const [goals, setGoals] = useState<string[]>(["Increase adoption", "Reduce time-to-first-value"]);
  const [nonGoals, setNonGoals] = useState<string[]>(["Rewrite of existing systems"]);
  const [users, setUsers] = useState<string[]>(["API Producer", "Integration Developer"]);
  const [assumptions, setAssumptions] = useState<string[]>(["Single-tenant beta first"]);
  const [metrics, setMetrics] = useState<string[]>(["Activation rate", "Retention D30"]);
  const [requirements, setRequirements] = useState<string[]>(["As a dev, I can provision …", "As an admin, I can configure …"]);
  const [risks, setRisks] = useState<string[]>(["Scope creep", "Timeline risk due to dependencies"]);

  const add = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter(prev => [...prev, ""]);
  const update = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number, val: string) => setter(prev => prev.map((v,i)=> i===idx? val : v));
  const remove = (setter: React.Dispatch<React.SetStateAction<string[]>>, idx: number) => setter(prev => prev.filter((_,i)=>i!==idx));

  const md = useMemo(() => {
    const sect = (name: string, arr: string[]) => arr.length ? `\\n## ${name}\\n` + arr.map(s=>`- ${s}`).join("\\n") + "\\n" : "";
    return [
      `# ${title || "Untitled PRD"}`,
      context ? `\\n> ${context}\\n` : "",
      "\\n## Problem Statement\\n" + (problem || ""),
      sect("Goals", goals),
      sect("Non-Goals", nonGoals),
      sect("Target Users & Personas", users),
      sect("Assumptions", assumptions),
      sect("Success Metrics", metrics),
      sect("Requirements", requirements),
      sect("Risks & Mitigations", risks),
    ].join("\\n");
  }, [title, context, problem, goals, nonGoals, users, assumptions, metrics, requirements, risks]);

  const downloadMD = () => downloadBlob(md, `${(title || "untitled").toLowerCase().replace(/[^a-z0-9]+/g,"-")}.md`, "text/markdown;charset=utf-8");

  return (
    <section className="grid lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <Card title="Overview">
          <label className="block text-sm text-slate-300">Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Project title" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2" />
          <label className="block text-sm text-slate-300 mt-2">Context (1–2 lines)</label>
          <textarea value={context} onChange={e=>setContext(e.target.value)} placeholder="Why now? Who benefits?" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2" rows={2} />
          <label className="block text-sm text-slate-300 mt-2">Problem Statement</label>
          <textarea value={problem} onChange={e=>setProblem(e.target.value)} placeholder="What problem are we solving?" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2" rows={3} />
        </Card>

        <EditableList title="Goals" items={goals} setItems={setGoals} placeholder="Clear, measurable outcome" />
        <EditableList title="Non-Goals" items={nonGoals} setItems={setNonGoals} placeholder="Explicitly out of scope" />
        <EditableList title="Target Users & Personas" items={users} setItems={setUsers} placeholder="e.g., Admin, Developer" />
        <EditableList title="Assumptions" items={assumptions} setItems={setAssumptions} placeholder="What must be true?" />
        <EditableList title="Success Metrics" items={metrics} setItems={setMetrics} placeholder="e.g., Activation rate +20%" />
        <EditableList title="Requirements" items={requirements} setItems={setRequirements} placeholder="As a <user>, I can…" />
        <EditableList title="Risks & Mitigations" items={risks} setItems={setRisks} placeholder="What could go wrong?" />

        <div className="flex gap-2">
          <button onClick={downloadMD} className="px-3 py-2 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10">Download PRD (Markdown)</button>
          <button onClick={()=>navigator.clipboard.writeText(md)} className="px-3 py-2 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10">Copy to Clipboard</button>
        </div>
      </div>

      <div className="space-y-3">
        <Card title="Live Preview">
          <pre className="whitespace-pre-wrap text-sm leading-6">{md}</pre>
        </Card>
        <Card title="README blurb">
          <p className="text-sm text-slate-300">Add this to your GitHub README:</p>
          <pre className="whitespace-pre-wrap text-xs mt-2">{`PM VibeKit — a minimal, local-first PM toolbox.
- RICE/ICE scoring with sortable table & exports
- PRD generator → Markdown in one click
- No backend. Built with React + Tailwind
`}</pre>
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm uppercase tracking-wider text-slate-300">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EditableList({ title, items, setItems, placeholder }: { title: string, items: string[], setItems: React.Dispatch<React.SetStateAction<string[]>>, placeholder?: string }) {
  const add = () => setItems(prev => [...prev, ""]);
  const update = (idx: number, val: string) => setItems(prev => prev.map((v,i)=> i===idx? val : v));
  const remove = (idx: number) => setItems(prev => prev.filter((_,i)=>i!==idx));
  return (
    <Card title={title}>
      <div className="space-y-2">
        {items.map((v, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input value={v} onChange={e=>update(idx,e.target.value)} placeholder={placeholder} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2" />
            <button onClick={()=>remove(idx)} className="px-2 py-2 rounded-xl text-xs border bg-white/5 border-white/10 hover:bg-white/10">Delete</button>
          </div>
        ))}
        <button onClick={add} className="px-3 py-2 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10">+ Add</button>
      </div>
    </Card>
  );
}
