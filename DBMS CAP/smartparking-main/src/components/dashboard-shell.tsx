import { Sidebar } from "@/components/sidebar";
import type { AppRole } from "@/lib/types";
import { Bell, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function DashboardShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "customer") as AppRole;
  const name = profile?.full_name || user.email?.split("@")[0] || "SmartPark user";

  return (
    <div className="app-frame">
      <Sidebar role={role} name={name} />
      <main className="main-panel">
        <header className="topbar">
          <div className="mobile-brand">SmartPark</div>
          <div className="topbar-search"><Search size={16} /><span>Parking made easier</span></div>
          <div className="topbar-right"><span className="status-dot" /> <span>System online</span><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><div className="avatar avatar-small">{name.slice(0,1).toUpperCase()}</div></div>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow">{role.toUpperCase()} WORKSPACE</div><h1>{title}</h1><p>{description}</p></div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
