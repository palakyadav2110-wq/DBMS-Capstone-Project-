import Link from "next/link";
export default function NotFound() {
  return <main className="auth-main"><div className="auth-box"><div className="eyebrow">404 / NOT FOUND</div><h2>That space isn't here.</h2><p>The page may have moved or the address may be incorrect.</p><Link className="button button-primary" href="/">Return home</Link></div></main>;
}
