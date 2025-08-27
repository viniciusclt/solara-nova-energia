import { redirect } from "next/navigation";

export default function LeadsRedirectPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const qs = new URLSearchParams();
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (Array.isArray(v)) v.forEach((vv) => qs.append(k, String(vv)));
      else if (v !== undefined) qs.set(k, String(v));
    }
  }
  const target = `/contacts${qs.toString() ? `?${qs.toString()}` : ""}`;
  redirect(target);
}