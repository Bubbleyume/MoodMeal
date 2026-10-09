import { Link } from "../lib/router";
import { TERMS } from "../data/glossary";
const names = [...TERMS.map(t => t.name), "Complex Carbs"].sort((a,b) => b.length-a.length);
const pattern = new RegExp(`(${names.join("|")})`, "gi");
export default function GlossaryText({text}: {text: string}) {
 return <>{text.split(pattern).map((part,i) => {
  const term = TERMS.find(t => t.name.toLowerCase() === part.toLowerCase()) ?? (part.toLowerCase() === "complex carbs" ? TERMS.find(t => t.id === "carbohydrates") : undefined);
  return term ? <Link key={i} to={`/glossary/${term.id}`} className="underline decoration-dotted underline-offset-2 text-brand-700" aria-label={`Learn about ${term.name}`}>{part}</Link> : part;
 })}</>;
}
