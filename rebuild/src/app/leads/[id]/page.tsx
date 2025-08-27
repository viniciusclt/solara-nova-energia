import { redirect } from "next/navigation";

export default function LeadDetailRedirectPage({ params }: { params: { id: string } }) {
  const id = params?.id;
  redirect(id ? `/contacts/${id}` : "/contacts");
}