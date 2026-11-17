import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { CarFront } from "lucide-react";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  const params = await searchParams;

  async function signUp(formData: FormData) {
    "use server";
    const fullName = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (fullName.length < 2) redirect("/signup?error=Please%20enter%20your%20full%20name.");
    if (password.length < 8) redirect("/signup?error=Password%20must%20be%20at%20least%208%20characters.");
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback` },
    });
    if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
    if (data.session) redirect("/dashboard");
    redirect("/login?message=Account%20created.%20Check%20your%20email%20to%20confirm%20your%20account.");
  }

  return <main className="auth-page"><section className="auth-side"><Link href="/" className="brand"><span className="brand-mark"><CarFront size={23}/></span><span>smart<span className="brand-light">park</span><small>Parking, made simple</small></span></Link><div><div className="eyebrow" style={{color:"#c4d6c3"}}>YOUR PARKING, ORGANISED</div><h1>Make room for what matters.</h1><p>Create your account to manage vehicles, reserve spaces, and keep track of every parking visit.</p></div><div className="auth-foot">Simple to use. Structured by design.</div></section><section className="auth-main"><div className="auth-box"><Link href="/" className="brand auth-logo-mobile"><span className="brand-mark"><CarFront size={23}/></span><span>smart<span className="brand-light">park</span><small>Parking, made simple</small></span></Link><h2>Create account</h2><p>Start with your name, email, and a secure password.</p>{params.error && <div className="notice error">{params.error}</div>}<form action={signUp} className="form-stack"><div className="form-field"><label htmlFor="full_name">Full name</label><input className="input" id="full_name" name="full_name" autoComplete="name" placeholder="Your full name" minLength={2} maxLength={120} required/></div><div className="form-field"><label htmlFor="email">Email address</label><input className="input" id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></div><div className="form-field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required/><span className="help-text">Use at least 8 characters. Never reuse an important password.</span></div><SubmitButton className="button button-primary" pendingText="Creating account…">Create account</SubmitButton></form><div className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></div><div className="auth-switch"><Link href="/">← Back to home</Link></div></div></section></main>;
}
