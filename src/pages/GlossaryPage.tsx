import {useState} from "react";
import {Link, useParams} from "../lib/router";
import Header from "../components/Header";
import {TERMS} from "../data/glossary";
export default function GlossaryPage() {
 const {id} = useParams(); const [search,setSearch] = useState("");
 const term = TERMS.find(t => t.id === id);
 return <div className="mm-soft-bg flex h-full flex-1 flex-col"><Header title="Food & wellness glossary" />
 <div className="screen-scroll space-y-4 px-4 pt-4">
 {id ? term ? <article className="card"><h1 className="section-title">{term.name}</h1><p className="mt-3 text-sm leading-relaxed">{term.definition}</p><a className="mt-3 block text-brand-700 underline" href={term.source} target="_blank" rel="noreferrer">Learn more from NIH / MedlinePlus</a><Link className="mt-4 block text-brand-700" to="/glossary">All glossary terms</Link></article> : <p>Term not found. <Link to="/glossary">Browse the glossary</Link></p> : <>
 <label className="block text-sm">Search terms<input className="well-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Try potassium or vitamin C" /></label>
 {TERMS.filter(t => `${t.name} ${t.definition}`.toLowerCase().includes(search.toLowerCase())).map(t=><Link className="card block" key={t.id} to={`/glossary/${t.id}`}><h2 className="font-bold text-brand-700">{t.name} →</h2><p className="mt-1 text-sm text-slate-500">{t.definition.split(". ")[0]}.</p></Link>)}
 {!TERMS.some(t=>`${t.name} ${t.definition}`.toLowerCase().includes(search.toLowerCase())) && <p>No matching terms.</p>}
 </>}
 </div></div>;
}
