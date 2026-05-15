import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;
const WHATSAPP_NUMBER = "233243426670";
const gh = (n) => `GH₵ ${Number(n).toFixed(2)}`;
const calcPaystackFee = (amount) => {
  const fee = (amount * 0.015) + 0.50;
  return Math.min(parseFloat(fee.toFixed(2)), 2.00);
};

// ── Google Fonts ──────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ── Global styles ─────────────────────────────────────────────────────────────
const globalStyle = document.createElement("style");
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; }
  input, select, button { font-family: 'DM Sans', sans-serif; }
  input:focus { border-color: #5B21B6 !important; box-shadow: 0 0 0 3px rgba(91,33,182,0.1) !important; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .bundle-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .bundle-card:hover { transform: translateY(-3px); }
  .wa-btn:hover { transform: scale(1.08) !important; }
  .nav-link { transition: color 0.15s, background 0.15s; }
  .nav-link:hover { background: rgba(91,33,182,0.08) !important; }
`;
document.head.appendChild(globalStyle);

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  violet:     "#5B21B6",
  violetMid:  "#7C3AED",
  violetLight:"#EDE9FE",
  violetGlow: "rgba(91,33,182,0.15)",
  mtn:   { bg: "#FFFBEB", text: "#92400E", dot: "#D97706", border: "#FDE68A" },
  tel:   { bg: "#FEF2F2", text: "#991B1B", dot: "#DC2626", border: "#FECACA" },
};

const light = {
  bg:       "#F8F7FF",
  surface:  "#FFFFFF",
  border:   "#E5E7EB",
  text:     "#111827",
  muted:    "#6B7280",
  subtle:   "#F3F4F6",
  shadow:   "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(91,33,182,0.06)",
  shadowMd: "0 4px 24px rgba(0,0,0,0.1), 0 8px 32px rgba(91,33,182,0.08)",
};

const dark = {
  bg:       "#0D0B14",
  surface:  "#161222",
  border:   "#2A2440",
  text:     "#F3F0FF",
  muted:    "#8B83A8",
  subtle:   "#1E1830",
  shadow:   "0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)",
  shadowMd: "0 4px 24px rgba(0,0,0,0.5)",
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  wifi: (c="currentColor",s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={c}/>
    </svg>
  ),
  store: (c="currentColor",s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  dashboard: (c="currentColor",s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  moon: (c="currentColor",s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
  sun: (c="currentColor",s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  lock: (c="currentColor",s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  user: (c="currentColor",s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  phone: (c="currentColor",s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.08 1.2 2 2 0 012.06 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  mail: (c="currentColor",s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  check: (c="currentColor",s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (c="currentColor",s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  clock: (c="currentColor",s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  logout: (c="currentColor",s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  plus: (c="currentColor",s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  trash: (c="currentColor",s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  ),
  arrow: (c="currentColor",s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  shield: (c="currentColor",s=16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  wa: (s=24) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="#fff">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  orders: (c="currentColor",s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  revenue: (c="currentColor",s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  box: (c="currentColor",s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  delivered: (c="currentColor",s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

// ── Network badge ─────────────────────────────────────────────────────────────
function Badge({ network }) {
  const s = network === "mtn" ? T.mtn : T.tel;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 11, fontWeight: 600, padding: "3px 10px",
      borderRadius: 6, background: s.bg, color: s.text,
      border: `1px solid ${s.border}`, letterSpacing: "0.02em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {network === "mtn" ? "MTN" : "Telecel"}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:   { bg: "#FFFBEB", color: "#92400E", border: "#FDE68A" },
    delivered: { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
    paid:      { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
    failed:    { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  };
  const s = map[status] || { bg: "#F9FAFB", color: "#374151", border: "#E5E7EB" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 10px",
      borderRadius: 6, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, letterSpacing: "0.02em",
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

// ── Input with icon ───────────────────────────────────────────────────────────
function InputField({ icon, type, placeholder, value, onChange, onKeyDown, dm }) {
  const palette = dm ? dark : light;
  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <div style={{
        position: "absolute", left: 14, top: "50%",
        transform: "translateY(-50%)", color: palette.muted,
        display: "flex", alignItems: "center", pointerEvents: "none",
      }}>
        {icon}
      </div>
      <input
        type={type || "text"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        style={{
          width: "100%", padding: "12px 14px 12px 44px",
          fontSize: 14, border: `1.5px solid ${palette.border}`,
          borderRadius: 10, outline: "none",
          background: palette.subtle, color: palette.text,
          transition: "border-color .15s, box-shadow .15s",
        }}
      />
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  const isErr = type === "error";
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
      background: isErr ? "#1F0A0A" : "#0A1F12",
      border: `1px solid ${isErr ? "#7F1D1D" : "#166534"}`,
      color: isErr ? "#FCA5A5" : "#86EFAC",
      padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      animation: "fadeUp .3s ease",
    }}>
      {isErr ? Icon.x("#FCA5A5", 16) : Icon.check("#86EFAC", 16)}
      {msg}
    </div>
  );
}

// ── Admin Login ───────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      await axios.post(`${API}/api/admin/login`, { username, password });
      onLogin({ username, password });
    } catch {
      setError("Invalid username or password.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0D0B14",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        position: "fixed", inset: 0, opacity: 0.04,
        backgroundImage: "radial-gradient(#7C3AED 1px, transparent 1px)",
        backgroundSize: "32px 32px", pointerEvents: "none",
      }} />
      <div style={{
        background: "#161222", borderRadius: 20,
        padding: "40px 36px", width: "100%", maxWidth: 400,
        border: "1px solid #2A2440",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        animation: "fadeUp .4s ease",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #5B21B6, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            {Icon.wifi("#fff", 22)}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#F3F0FF", letterSpacing: "-0.02em" }}>
            Sign in to DataFlow
          </div>
          <div style={{ fontSize: 14, color: "#8B83A8", marginTop: 6 }}>
            Admin access only
          </div>
        </div>

        <InputField icon={Icon.user("#8B83A8", 16)} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} dm={true} />
        <InputField icon={Icon.lock("#8B83A8", 16)} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} dm={true} />

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#1F0A0A", border: "1px solid #7F1D1D",
            color: "#FCA5A5", borderRadius: 8, padding: "10px 14px",
            fontSize: 13, marginBottom: 16,
          }}>
            {Icon.x("#FCA5A5", 14)} {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading} style={{
          width: "100%", padding: "13px 0",
          background: loading ? "#3B1D8A" : "linear-gradient(135deg, #5B21B6, #7C3AED)",
          border: "none", borderRadius: 10, color: "#fff",
          fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {loading ? (
            <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
          ) : (
            <>{Icon.arrow("#fff", 16)} Sign in</>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Buy Modal ─────────────────────────────────────────────────────────────────
function BuyModal({ bundle, onClose, dm }) {
  const [recipientPhone, setRecipient] = useState("");
  const [payerEmail, setEmail]         = useState("");
  const [loading, setLoading]          = useState(false);
  const [error, setError]              = useState("");
  const palette = dm ? dark : light;

  const paystackFee  = calcPaystackFee(bundle.price);
  const totalAmount  = parseFloat((bundle.price + paystackFee).toFixed(2));

  const handleBuy = async () => {
    if (!recipientPhone || !payerEmail) { setError("Please fill in all fields."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/orders`, {
        bundleId: bundle.id, recipientPhone, payerEmail,
      });
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setLoading(false);
      setError(e.response?.data?.error || "Something went wrong. Please try again.");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: palette.surface, borderRadius: 20, width: "100%", maxWidth: 420,
        border: `1px solid ${palette.border}`, boxShadow: palette.shadowMd,
        maxHeight: "90vh", overflowY: "auto", animation: "fadeUp .25s ease",
      }}>
        {/* Bundle header */}
        <div style={{
          padding: "24px 24px 20px",
          borderBottom: `1px solid ${palette.border}`,
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div>
            <Badge network={bundle.network} />
            <div style={{ fontSize: 36, fontWeight: 700, color: palette.text, letterSpacing: "-0.03em", marginTop: 8, lineHeight: 1 }}>
              {bundle.data}
            </div>
            <div style={{ fontSize: 13, color: palette.muted, marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
              {Icon.clock(palette.muted, 12)}
              <span>{bundle.validity || "No expiry"}</span>
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.violet, letterSpacing: "-0.02em" }}>
            {gh(bundle.price)}
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: palette.muted, marginBottom: 12, letterSpacing: "0.02em", textTransform: "uppercase" }}>
            Recipient details
          </div>

          <InputField
            icon={Icon.phone(palette.muted, 16)}
            type="tel"
            placeholder="Recipient phone number"
            value={recipientPhone}
            onChange={e => setRecipient(e.target.value)}
            dm={dm}
          />
          <InputField
            icon={Icon.mail(palette.muted, 16)}
            type="email"
            placeholder="Email address for receipt"
            value={payerEmail}
            onChange={e => setEmail(e.target.value)}
            dm={dm}
          />

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: dm ? "#1F0A0A" : "#FEF2F2",
              border: `1px solid ${dm ? "#7F1D1D" : "#FECACA"}`,
              color: dm ? "#FCA5A5" : "#991B1B",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14,
            }}>
              {Icon.x(dm ? "#FCA5A5" : "#991B1B", 14)} {error}
            </div>
          )}

          {/* Payment summary */}
          <div style={{
            background: palette.subtle, borderRadius: 12,
            padding: "14px 16px", marginBottom: 20,
            border: `1px solid ${palette.border}`,
          }}>
            {[
              ["Bundle",          `${bundle.data}`],
              ["Network",         bundle.network === "mtn" ? "MTN" : "Telecel"],
              ["Bundle price",    gh(bundle.price)],
              ["Processing fee",  `+ ${gh(paystackFee)}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: palette.muted }}>{k}</span>
                <span style={{ fontWeight: 600, color: palette.text }}>{v}</span>
              </div>
            ))}
            <div style={{
              borderTop: `1px solid ${palette.border}`, paddingTop: 10,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 13, color: palette.muted }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: T.violet, letterSpacing: "-0.02em" }}>
                {gh(totalAmount)}
              </span>
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: palette.muted }}>
              {Icon.shield(palette.muted, 12)} Secured by Paystack · No expiry on bundle
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{
              padding: "12px 20px", border: `1.5px solid ${palette.border}`,
              borderRadius: 10, background: "transparent", color: palette.muted,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              Cancel
            </button>
            <button onClick={handleBuy} disabled={loading} style={{
              flex: 1, padding: "12px 0",
              background: loading ? (dm ? "#3B1D8A" : "#7C3AED") : "linear-gradient(135deg, #5B21B6, #7C3AED)",
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {loading ? (
                <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
              ) : (
                <>{Icon.arrow("#fff", 16)} Pay {gh(totalAmount)}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Payment Callback ──────────────────────────────────────────────────────────
function PaymentCallback() {
  const [status, setStatus] = useState("checking");
  const reference =
    new URLSearchParams(window.location.search).get("reference") ||
    new URLSearchParams(window.location.search).get("trxref");

  useEffect(() => {
    if (!reference) { setStatus("error"); return; }
    const check = async () => {
      try {
        const { data } = await axios.get(`${API}/api/orders/${reference}`);
        setStatus(data.order.status);
      } catch { setStatus("error"); }
    };
    check();
    const iv = setInterval(check, 3000);
    setTimeout(() => clearInterval(iv), 60000);
    return () => clearInterval(iv);
  }, [reference]);

  const isSuccess = ["delivered", "paid"].includes(status);
  const isFailed  = ["failed", "error"].includes(status);
  const isPending = ["pending", "checking"].includes(status);

  const iconEl = isSuccess
    ? <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icon.check("#16A34A", 28)}</div>
    : isFailed
      ? <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF2F2", border: "1px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center" }}>{Icon.x("#DC2626", 28)}</div>
      : <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.violetLight, border: `1px solid ${T.violet}30`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 28, height: 28, border: `3px solid ${T.violet}30`, borderTopColor: T.violet, borderRadius: "50%", display: "inline-block", animation: "spin .8s linear infinite" }} /></div>;

  const title   = isSuccess ? "Payment confirmed" : isFailed ? "Payment failed" : "Processing payment";
  const message = isSuccess
    ? "Your data bundle has been delivered successfully."
    : isFailed
      ? "Your payment was not completed. No charge was made."
      : "Please wait while we confirm your payment…";

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FF", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 400, border: "1px solid #E5E7EB", boxShadow: "0 8px 40px rgba(0,0,0,0.08)", textAlign: "center", animation: "fadeUp .4s ease" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>{iconEl}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>{message}</div>
        {reference && (
          <div style={{ background: "#F8F7FF", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "#6B7280", marginBottom: 24, fontFamily: "'DM Mono', monospace" }}>
            Ref: {reference}
          </div>
        )}
        {!isPending && (
          <a href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", background: "linear-gradient(135deg, #5B21B6, #7C3AED)", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            {Icon.store("#fff", 16)} Back to store
          </a>
        )}
      </div>
    </div>
  );
}

// ── Store View ────────────────────────────────────────────────────────────────
function StoreView({ onBuy, dm }) {
  const [bundles, setBundles] = useState([]);
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(true);
  const palette = dm ? dark : light;

  useEffect(() => {
    axios.get(`${API}/api/bundles`)
      .then(r => setBundles(r.data.bundles))
      .finally(() => setLoading(false));
  }, []);

  const visible = bundles.filter(b => filter === "all" || b.network === filter);

  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      {/* Hero */}
      <div style={{
        background: dm
          ? "linear-gradient(135deg, #1A0A3D 0%, #0D0B14 100%)"
          : "linear-gradient(135deg, #3B0764 0%, #5B21B6 60%, #7C3AED 100%)",
        borderRadius: 20, padding: "36px 32px", marginBottom: 28,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: 60, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 16, fontWeight: 500 }}>
            {Icon.shield("rgba(255,255,255,0.8)", 12)} Secured payments · No expiry bundles
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 10 }}>
            Data bundles,<br />delivered instantly.
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
            MTN & Telecel bundles. Pay with Mobile Money.
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, background: palette.surface, borderRadius: 12, padding: 4, border: `1px solid ${palette.border}`, width: "fit-content" }}>
        {[
          { key: "all",     label: "All networks" },
          { key: "mtn",     label: "MTN" },
          { key: "telecel", label: "Telecel" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: "7px 18px", borderRadius: 9, fontSize: 13,
            fontWeight: filter === key ? 600 : 400, cursor: "pointer",
            border: "none",
            background: filter === key ? T.violet : "transparent",
            color: filter === key ? "#fff" : palette.muted,
            transition: "all .15s",
          }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: palette.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
        {visible.length} bundle{visible.length !== 1 ? "s" : ""} available
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
          <span style={{ width: 28, height: 28, border: `3px solid ${palette.border}`, borderTopColor: T.violet, borderRadius: "50%", animation: "spin .8s linear infinite", display: "inline-block" }} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 12 }}>
          {visible.map((b, i) => (
            <div key={b.id} className="bundle-card" style={{
              background: palette.surface, borderRadius: 16, padding: "20px 18px",
              border: `1px solid ${palette.border}`, boxShadow: palette.shadow,
              display: "flex", flexDirection: "column",
              animation: `fadeUp .4s ease ${i * 0.05}s both`,
            }}>
              <div style={{ marginBottom: 14 }}>
                <Badge network={b.network} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: palette.text, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
                {b.data}
              </div>
              <div style={{ fontSize: 12, color: palette.muted, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                {Icon.clock(palette.muted, 12)}
                <span>{b.validity || "No expiry"}</span>
              </div>
              <div style={{ marginTop: "auto", paddingTop: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: T.violet, letterSpacing: "-0.02em", marginBottom: 12 }}>
                  {gh(b.price)}
                </div>
                <button onClick={() => onBuy(b)} style={{
                  width: "100%", padding: "10px 0",
                  background: "linear-gradient(135deg, #5B21B6, #7C3AED)",
                  border: "none", borderRadius: 9, color: "#fff",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: "0 2px 8px rgba(91,33,182,0.3)",
                  transition: "opacity .15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  {Icon.arrow("#fff", 14)} Buy now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin View ────────────────────────────────────────────────────────────────
function AdminView({ showToast, adminCreds, onLogout, dm }) {
  const [bundles, setBundles] = useState([]);
  const [orders, setOrders]   = useState([]);
  const [form, setForm]       = useState({ network: "telecel", data: "", validity: "No expiry", price: "" });
  const palette = dm ? dark : light;

  const authHeaders = { username: adminCreds.username, password: adminCreds.password };

  const loadAll = useCallback(() => {
    axios.get(`${API}/api/bundles`).then(r => setBundles(r.data.bundles));
    axios.get(`${API}/api/orders`).then(r => setOrders(r.data.orders));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addBundle = async () => {
    if (!form.data || !form.price) return;
    await axios.post(`${API}/api/bundles`, { ...form, price: Number(form.price) }, { headers: authHeaders });
    setForm({ network: "telecel", data: "", validity: "No expiry", price: "" });
    loadAll(); showToast("Bundle added");
  };

  const removeBundle = async (id) => {
    await axios.delete(`${API}/api/bundles/${id}`, { headers: authHeaders });
    loadAll(); showToast("Bundle removed");
  };

  const revenue = orders
    .filter(o => o.status === "delivered")
    .reduce((s, o) => s + (o.bundle?.price || 0), 0);

  const cardStyle = {
    background: palette.surface, borderRadius: 16,
    border: `1px solid ${palette.border}`, padding: "20px 24px",
    marginBottom: 16, boxShadow: palette.shadow,
  };

  const thS = {
    textAlign: "left", fontSize: 11, fontWeight: 600, color: palette.muted,
    padding: "0 14px 12px", borderBottom: `1px solid ${palette.border}`,
    textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
  };

  const tdS = {
    padding: "13px 14px", borderBottom: `1px solid ${palette.border}`,
    color: palette.text, fontSize: 13,
  };

  const inputS = {
    width: "100%", padding: "10px 12px", fontSize: 13,
    border: `1.5px solid ${palette.border}`, borderRadius: 8,
    background: palette.subtle, color: palette.text, outline: "none",
  };

  const stats = [
    { label: "Total orders",   value: orders.length,                                       icon: Icon.orders(T.violet, 20)    },
    { label: "Revenue",        value: gh(revenue),                                         icon: Icon.revenue(T.violet, 20)   },
    { label: "Active bundles", value: bundles.length,                                      icon: Icon.box(T.violet, 20)       },
    { label: "Delivered",      value: orders.filter(o => o.status === "delivered").length, icon: Icon.delivered(T.violet, 20) },
  ];

  return (
    <div style={{ animation: "fadeUp .4s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: palette.text, letterSpacing: "-0.02em" }}>Dashboard</div>
          <div style={{ fontSize: 13, color: palette.muted, marginTop: 3 }}>Welcome back, {adminCreds.username}</div>
        </div>
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "9px 16px", border: `1.5px solid ${palette.border}`,
          borderRadius: 9, background: "transparent", color: palette.muted,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          {Icon.logout(palette.muted, 16)} Sign out
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        {stats.map(({ label, value, icon }, i) => (
          <div key={label} style={{ ...cardStyle, marginBottom: 0, animation: `fadeUp .4s ease ${i * 0.07}s both` }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: T.violetLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              {icon}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: palette.text, letterSpacing: "-0.02em" }}>{value}</div>
            <div style={{ fontSize: 12, color: palette.muted, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Add bundle */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 600, color: palette.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          {Icon.plus(T.violet, 16)} Add new bundle
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <select value={form.network} onChange={e => setForm(f => ({ ...f, network: e.target.value }))} style={inputS}>
            <option value="telecel">Telecel</option>
            <option value="mtn">MTN</option>
          </select>
          <input placeholder="Data e.g. 5GB" value={form.data}
            onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={inputS} />
          <input placeholder="Validity" value={form.validity}
            onChange={e => setForm(f => ({ ...f, validity: e.target.value }))} style={inputS} />
          <input type="number" placeholder="Your price (GH₵)" value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={inputS} />
          <button onClick={addBundle} style={{
            padding: "10px 0", background: "linear-gradient(135deg, #5B21B6, #7C3AED)",
            border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
            fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {Icon.plus("#fff", 14)} Add bundle
          </button>
        </div>
      </div>

      {/* Bundles table */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 600, color: palette.text, marginBottom: 16 }}>Bundles</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Network","Data","Validity","Your price",""].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {bundles.map(b => (
                <tr key={b.id}>
                  <td style={tdS}><Badge network={b.network} /></td>
                  <td style={{ ...tdS, fontWeight: 600 }}>{b.data}</td>
                  <td style={tdS}>{b.validity || "No expiry"}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: T.violet }}>{gh(b.price)}</td>
                  <td style={tdS}>
                    <button onClick={() => removeBundle(b.id)} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: dm ? "#1F0A0A" : "#FEF2F2",
                      border: `1px solid ${dm ? "#7F1D1D" : "#FECACA"}`,
                      color: dm ? "#FCA5A5" : "#991B1B",
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                      padding: "5px 10px", borderRadius: 7,
                    }}>
                      {Icon.trash(dm ? "#FCA5A5" : "#991B1B", 13)} Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders table */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 600, color: palette.text, marginBottom: 16 }}>Recent orders</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Reference","Bundle","Recipient","Bundle price","Fee","Total","Status"].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} style={{ ...tdS, color: palette.muted, textAlign: "center", padding: 32, borderBottom: "none" }}>No orders yet</td></tr>
              ) : orders.map(o => (
                <tr key={o.reference}>
                  <td style={{ ...tdS, fontFamily: "'DM Mono', monospace", fontSize: 11, color: palette.muted }}>{o.reference}</td>
                  <td style={tdS}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Badge network={o.bundle?.network} />
                      <span style={{ fontWeight: 600 }}>{o.bundle?.data}</span>
                    </div>
                  </td>
                  <td style={tdS}>{o.recipientPhone}</td>
                  <td style={{ ...tdS, color: T.violet, fontWeight: 600 }}>{gh(o.bundle?.price || 0)}</td>
                  <td style={{ ...tdS, color: palette.muted }}>{gh(o.paystackFee || 0)}</td>
                  <td style={{ ...tdS, fontWeight: 700, color: T.violet }}>{gh(o.totalAmount || 0)}</td>
                  <td style={tdS}><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]               = useState("store");
  const [buyBundle, setBuyBundle]   = useState(null);
  const [toast, setToast]           = useState({ msg: "", type: "success" });
  const [adminCreds, setAdminCreds] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [dm, setDm]                 = useState(false);
  const palette = dm ? dark : light;

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);
  const handleAdminLogin = (creds) => { setAdminCreds(creds); setShowAdminLogin(false); setTab("admin"); };
  const handleLogout = () => { setAdminCreds(null); setTab("store"); };
  const handleAdminTabClick = () => { if (adminCreds) setTab("admin"); else setShowAdminLogin(true); };

  if (window.location.pathname === "/payment/callback") return <PaymentCallback />;
  if (showAdminLogin) return <AdminLogin onLogin={handleAdminLogin} />;

  return (
    <div style={{ background: palette.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", transition: "background .3s" }}>

      {/* Nav */}
      <nav style={{
        background: palette.surface,
        borderBottom: `1px solid ${palette.border}`,
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #5B21B6, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Icon.wifi("#fff", 16)}
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: palette.text, letterSpacing: "-0.02em" }}>
            DataFlow GH
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[
            { key: "store",   label: "Store",     icon: Icon.store },
            { key: "admin",   label: "Dashboard", icon: Icon.dashboard },
          ].map(({ key, label, icon }) => (
            <button key={key} className="nav-link" onClick={key === "admin" ? handleAdminTabClick : () => setTab(key)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 14px", borderRadius: 8, border: "none",
              background: tab === key ? T.violetLight : "transparent",
              color: tab === key ? T.violet : palette.muted,
              fontSize: 13, fontWeight: tab === key ? 600 : 400, cursor: "pointer",
            }}>
              {icon(tab === key ? T.violet : palette.muted, 16)} {label}
            </button>
          ))}

          <button onClick={() => setDm(d => !d)} style={{
            width: 36, height: 36, borderRadius: 9,
            border: `1px solid ${palette.border}`,
            background: palette.subtle, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: palette.muted, marginLeft: 4,
          }}>
            {dm ? Icon.sun(palette.muted, 16) : Icon.moon(palette.muted, 16)}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px" }}>
        {tab === "store" && <StoreView onBuy={setBuyBundle} dm={dm} />}
        {tab === "admin" && adminCreds && (
          <AdminView showToast={showToast} adminCreds={adminCreds} onLogout={handleLogout} dm={dm} />
        )}
      </div>

      {buyBundle && <BuyModal bundle={buyBundle} onClose={() => setBuyBundle(null)} dm={dm} />}

      {/* WhatsApp FAB */}
      <button
        className="wa-btn"
        onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hello!%20I%20need%20help%20with%20a%20data%20bundle.`, "_blank")}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9998,
          width: 52, height: 52, borderRadius: "50%",
          background: "#25D366", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37,211,102,0.45)",
          transition: "transform .2s ease, box-shadow .2s ease",
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 28px rgba(37,211,102,0.65)"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,211,102,0.45)"}
        title="Chat on WhatsApp"
      >
        {Icon.wa(24)}
      </button>

      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast({ msg: "" })} />
    </div>
  );
}