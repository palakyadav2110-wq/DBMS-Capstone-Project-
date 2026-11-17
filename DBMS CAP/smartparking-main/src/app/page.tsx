import Link from "next/link";
import { ArrowRight, CarFront, Clock3, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="landing">
      <header className="landing-nav">
        <Link href="/" className="brand"><span className="brand-mark"><CarFront size={23}/></span><span>smart<span className="brand-light">park</span><small>Parking, made simple</small></span></Link>
        <nav><Link href="/locations">Locations</Link><Link href="/login">Sign in</Link><Link className="button button-primary" href="/signup">Get started <ArrowRight size={15}/></Link></nav>
      </header>
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="hero-pill"><span className="status-dot"/> A smarter way to park</div>
          <h1>Your spot.<br/><span>Your time.</span><br/>Your peace of mind.</h1>
          <p>Find a parking space, reserve it before you arrive, and keep every visit organised in one simple place.</p>
          <div className="button-row"><Link className="button button-primary" href="/signup">Reserve a spot <ArrowRight size={16}/></Link><Link className="button button-secondary" href="/locations">Explore locations</Link></div>
          <div className="trust-line"><CheckCircle2 size={16}/> Simple reservations <CheckCircle2 size={16}/> Clear pricing <CheckCircle2 size={16}/> Secure accounts</div>
        </div>
        <div className="parking-illustration">
          <div className="illustration-top"><div><span className="eyebrow">SMARTPARK / LIVE VIEW</span><h3>Parking overview</h3></div><span className="live-pill"><span className="status-dot"/> Demo view</span></div>
          <div className="parking-road"><div className="road-line"/></div>
          <div className="parking-bays">
            {["A01","A02","A03","B01","B02","B03"].map((slot,i)=><div key={slot} className={`bay ${i===2||i===4?"bay-busy":""}`}><div className="mini-car"><CarFront size={26}/></div><strong>{slot}</strong><span>{i===2||i===4?"Occupied":"Example slot"}</span></div>)}
          </div>
          <div className="illustration-bottom"><span><i className="legend-free"/> Example spaces</span><span><i className="legend-busy"/> Example occupied</span><span>Illustrative data</span></div>
        </div>
      </section>
      <section className="landing-features">
        <div className="feature"><span className="feature-icon"><MapPin size={20}/></span><h3>Find your place</h3><p>Browse parking locations and explore the spaces available at each facility.</p></div>
        <div className="feature"><span className="feature-icon"><Clock3 size={20}/></span><h3>Book in advance</h3><p>Choose a time window and manage your reservations from one dashboard.</p></div>
        <div className="feature"><span className="feature-icon"><ShieldCheck size={20}/></span><h3>Built with care</h3><p>Database constraints and access policies help protect your reservation data.</p></div>
      </section>
      <footer className="landing-footer"><span>© {new Date().getFullYear()} SmartPark</span><span>Student DBMS capstone · Supabase PostgreSQL</span></footer>
      <style>{`
        .landing{max-width:1440px;margin:auto;padding:0 5.5%;background:#f7f8f3;min-height:100vh}
        .landing-nav{height:86px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e7eae2}
        .landing-nav nav{display:flex;align-items:center;gap:26px;color:#647263;font-size:12px;font-weight:700}
        .landing-hero{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:5%;padding:74px 0 68px}
        .landing-copy h1{font-size:clamp(42px,5vw,68px);line-height:1.02;letter-spacing:-3px;margin:23px 0 20px;color:#202a22}
        .landing-copy h1 span{color:#648666}
        .landing-copy>p{max-width:480px;font-size:15px;line-height:1.9;color:#788176;margin:0 0 25px}
        .hero-pill,.live-pill{display:inline-flex;align-items:center;gap:8px;border:1px solid #dfe8d9;background:#edf3e9;color:#416b49;border-radius:999px;padding:8px 12px;font-size:10px;font-weight:800}
        .trust-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:24px;color:#788176;font-size:10px}.trust-line svg{color:#68926a}
        .parking-illustration{background:#fff;border:1px solid #e4e9df;border-radius:21px;padding:23px;box-shadow:0 18px 60px rgba(32,56,37,.07);transform:rotate(.5deg)}
        .illustration-top{display:flex;justify-content:space-between;align-items:center}.illustration-top h3{margin:8px 0 0;font-size:20px;letter-spacing:-.5px}
        .live-pill{padding:6px 9px;font-size:9px}
        .parking-road{height:30px;margin:25px -23px 15px;background:#edf0e9;position:relative;overflow:hidden}.road-line{position:absolute;left:0;right:0;top:14px;border-top:2px dashed #bdc8b8}
        .parking-bays{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .bay{background:#f5f8f1;border:1px solid #dce7d8;border-radius:10px;padding:12px 6px;text-align:center;color:#46754d}
        .bay-busy{background:#fff5ef;border-color:#f1ded1;color:#b47851}
        .mini-car{height:47px;display:grid;place-items:center;margin-bottom:7px}
        .bay strong{display:block;font-size:12px;color:#2c3c2f}.bay span{font-size:9px;color:#81907d}
        .illustration-bottom{display:flex;gap:12px;justify-content:space-between;flex-wrap:wrap;color:#8a9485;font-size:9px;margin-top:19px}
        .illustration-bottom span{display:flex;align-items:center;gap:5px}.illustration-bottom span:last-child{display:block}
        .legend-free,.legend-busy{width:7px;height:7px;border-radius:50%;background:#7da77a}.legend-busy{background:#cf9870}
        .landing-features{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;border-top:1px solid #e4e9df;padding:35px 0 45px}
        .feature{padding:9px 12px}.feature-icon{width:42px;height:42px;border-radius:13px;background:#e7eee5;display:grid;place-items:center;color:#426c4b}
        .feature h3{font-size:15px;margin:17px 0 8px}.feature p{font-size:12px;line-height:1.8;color:#788176;max-width:290px;margin:0}
        .landing-footer{border-top:1px solid #e4e9df;padding:20px 0;display:flex;justify-content:space-between;color:#929b8e;font-size:10px}
        @media(max-width:850px){.landing-hero{grid-template-columns:1fr;padding:45px 0;gap:35px}.landing-copy h1{font-size:52px}.landing-features{gap:8px}.landing{padding:0 22px}}
        @media(max-width:600px){.landing-nav{height:72px}.landing-nav nav{gap:12px}.landing-nav nav>a:first-child{display:none}.landing-nav nav .button{padding:10px}.landing-hero{padding:38px 0}.landing-copy h1{font-size:45px;letter-spacing:-2px}.parking-illustration{padding:16px}.parking-road{margin-left:-16px;margin-right:-16px}.landing-features{grid-template-columns:1fr}.feature{padding:12px 4px}.landing-footer{gap:10px;flex-direction:column}}
      `}</style>
    </main>
  );
}
