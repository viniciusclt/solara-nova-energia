import { redirect } from "next/navigation";

export default async function NewLeadRedirectPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const qs = new URLSearchParams();
  const sp = (await searchParams) ?? {};
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((vv) => qs.append(k, String(vv)));
    else if (v !== undefined) qs.set(k, String(v));
  }
  const target = `/contacts/new${qs.toString() ? `?${qs.toString()}` : ""}`;
  redirect(target);
}