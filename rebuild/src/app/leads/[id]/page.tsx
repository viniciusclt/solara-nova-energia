import { redirect } from "next/navigation";

export default async function LeadDetailRedirectPage({ params }: { params: Promise<{ id?: string | string[] }> }) {
  const p = await params;
  const id = Array.isArray(p?.id) ? p?.id?.[0] : p?.id;
  redirect(id ? `/contacts/${id}` : "/contacts");
}