import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { CarFront } from "lucide-react";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  const params = await searchParams;

  async function signIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
    redirect("/dashboard");
  }

  return <main className="auth-page"><section className="auth-side"><Link href="/" className="brand"><span className="brand-mark"><CarFront size={23}/></span><span>smart<span className="brand-light">park</span><small>Parking, made simple</small></span></Link><div><div className="eyebrow" style={{color:"#c4d6c3"}}>WELCOME BACK</div><h1>Less circling.<br/>More living.</h1><p>Your parking plans, vehicles, and reservations are all waiting in one organised place.</p></div><div className="auth-foot">SmartPark · A database-first parking platform</div></section><section className="auth-main"><div className="auth-box"><Link href="/" className="brand auth-logo-mobile"><span className="brand-mark"><CarFront size={23}/></span><span>smart<span className="brand-light">park</span><small>Parking, made simple</small></span></Link><h2>Sign in</h2><p>Enter your account details to continue to SmartPark.</p>{params.error && <div className="notice error">{params.error}</div>}{params.message && <div className="notice">{params.message}</div>}<form action={signIn} className="form-stack"><div className="form-field"><label htmlFor="email">Email address</label><input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></div><div className="form-field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" placeholder="Your password" required/></div><SubmitButton className="button button-primary" pendingText="Signing in…">Sign in</SubmitButton></form><div className="auth-switch">New to SmartPark? <Link href="/signup">Create an account</Link></div><div className="auth-switch"><Link href="/">← Back to home</Link></div></div></section></main>;
}
