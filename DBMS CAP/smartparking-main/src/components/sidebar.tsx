import Link from "next/link";
import { CarFront, LayoutDashboard, MapPin, CalendarDays, ShieldCheck, Settings2 } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import type { AppRole } from "@/lib/types";

export function Sidebar({ role, name }: { role: AppRole; name: string }) {
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, show: true },
    { href: "/locations", label: "Find parking", icon: MapPin, show: true },
    { href: "/vehicles", label: "My vehicles", icon: CarFront, show: true },
    { href: "/bookings", label: "My bookings", icon: CalendarDays, show: true },
    { href: "/staff", label: "Gate operations", icon: ShieldCheck, show: role === "staff" || role === "admin" },
    { href: "/admin", label: "Management", icon: Settings2, show: role === "admin" },
  ];

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark"><CarFront size={23} /></span>
        <span>smart<span className="brand-light">park</span><small>Parking, made simple</small></span>
      </Link>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="nav-list">
        {links.filter((link) => link.show).map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} className="nav-item">
            <Icon size={18} /> {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="profile-mini">
          <div className="avatar">{name.slice(0, 1).toUpperCase() || "S"}</div>
          <div className="profile-mini-text"><strong>{name || "SmartPark user"}</strong><span>{role}</span></div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
