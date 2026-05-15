import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;
const gh = (n) => `GH₵ ${Number(n).toFixed(2)}`;

// ── Theme ────────────────────────────────────────────────────────────────────
const theme = {
  purple:     "#6C3EE8",
  purpleDark: "#4B27C0",
  purpleDeep: "#2D1B6B",
  purpleLight:"#EDE8FB",
  purpleMid:  "#9B7FF0",
  mtn:        { bg: "#FFF4DE", color: "#8B5E00", btn: "#F0A500" },
  telecel: { bg: "#FFE8E8", color: "#8B1A1A", btn: "#E83232" },
};

const NET = {
  mtn:     { label: "MTN",     ...theme.mtn },
  telecel: { label: "Telecel", ...theme.telecel },
};

const STATUS = {
  pending:   { bg: "#FFF4DE", color: "#8B5E00" },
  delivered: { bg: "#E8FBF3", color: "#1A6B45" },
  failed:    { bg: "#FDE8E8", color: "#8B1A1A" },
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = {
  background: "#fff",
  borderRadius: 20,
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 2px 16px rgba(108,62,232,0.07)",
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  fontSize: 15,
  border: "1.5px solid #E8E0FB",
  borderRadius: 12,
  outline: "none",
  boxSizing: "border-box",
  background: "#FAFAFA",
  color: "#1a1a2e",
  marginBottom: 14,
};

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ network }) {
  const s = NET[network] || {};
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, background: s.bg, color: s.color,
      letterSpacing: "0.03em",
    }}>
      {s.label || network}
    </span>
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
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: type === "error" ? "#8B1A1A" : theme.purple,
      color: "#fff", padding: "14px 22px", borderRadius: 14,
      fontSize: 14, maxWidth: 320,
      boxShadow: "0 8px 32px rgba(108,62,232,0.25)",
    }}>
      {msg}
    </div>
  );
}

// ── Admin Login Screen ────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/api/admin/login`, { username, password });
      onLogin({ username, password });
    } catch (e) {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F4F0FF",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "40px 32px",
        width: "100%", maxWidth: 380,
        boxShadow: "0 8px 40px rgba(108,62,232,0.12)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: `linear-gradient(135deg, ${theme.purple}, ${theme.purpleDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px", fontSize: 26,
          }}>
            📶
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: theme.purpleDeep }}>
            DataFlow GH
          </div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
            Admin portal
          </div>
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
          Username
        </label>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />

        <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
          Password
        </label>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          style={inputStyle}
        />

        {error && (
          <div style={{
            background: "#FDE8E8", color: "#8B1A1A",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "14px 0",
            background: `linear-gradient(135deg, ${theme.purple}, ${theme.purpleDark})`,
            border: "none", borderRadius: 14, color: "#fff",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}

// ── Buy Modal ─────────────────────────────────────────────────────────────────
function BuyModal({ bundle, onClose, onSuccess }) {
  const [recipientPhone, setRecipient] = useState("");
  const [payerPhone, setPayer]         = useState("");
  const [payerEmail, setEmail]         = useState("");
  const [sameNumber, setSame]          = useState(true);
  const [loading, setLoading]          = useState(false);
  const [waiting, setWaiting]          = useState(false);
  const [error, setError]              = useState("");

  const pollOrder = useCallback((reference) => {
    setWaiting(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await axios.get(`${API}/api/orders/${reference}`);
        if (["delivered", "paid"].includes(data.order.status)) {
          clearInterval(interval);
          onSuccess(data.order);
        } else if (data.order.status === "failed") {
          clearInterval(interval);
          setWaiting(false);
          setLoading(false);
          setError(data.order.failReason || "Payment was declined. Please try again.");
        }
      } catch (_) {}
      if (attempts >= 40) {
        clearInterval(interval);
        setWaiting(false);
        setLoading(false);
        setError("Payment timed out. Contact support if you were charged.");
      }
    }, 3000);
  }, [onSuccess]);

  const handleBuy = async () => {
    const payer = sameNumber ? recipientPhone : payerPhone;
    if (!recipientPhone || !payer || !payerEmail) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/orders`, {
        bundleId: bundle.id,
        recipientPhone,
        payerPhone: payer,
        payerEmail,
      });
      pollOrder(data.reference);
    } catch (e) {
      setLoading(false);
      setError(e.response?.data?.error || "Something went wrong. Try again.");
    }
  };

  const net = NET[bundle.network] || {};

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(45,27,107,0.55)",
      zIndex: 500, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: 28,
        width: "100%", maxWidth: 400,
        boxShadow: "0 16px 60px rgba(108,62,232,0.2)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.purple}, ${theme.purpleDark})`,
          borderRadius: 16, padding: "20px 20px",
          marginBottom: 24, color: "#fff",
        }}>
          <Badge network={bundle.network} />
          <div style={{ fontSize: 32, fontWeight: 800, margin: "8px 0 2px" }}>
            {bundle.data}
          </div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>
            Valid {bundle.validity} · Expires in {bundle.expiry || "90 days"} · {gh(bundle.price)}
          </div>
        </div>

        {waiting ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: theme.purpleLight,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 34,
              margin: "0 auto 20px",
            }}>
              📲
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: theme.purpleDeep, marginBottom: 10 }}>
              Check your phone!
            </div>
            <div style={{ fontSize: 14, color: "#666", lineHeight: 1.7 }}>
              A payment prompt has been sent to{" "}
              <strong>{sameNumber ? recipientPhone : payerPhone}</strong>.
              <br />
              Enter your {bundle.network === "mtn" ? "MTN MoMo" : "Telecel Cash"} PIN to complete.
            </div>
            <div style={{
              marginTop: 20, fontSize: 12, color: "#aaa",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6,
            }}>
              <span style={{
                display: "inline-block", width: 8, height: 8,
                borderRadius: "50%", background: theme.purple,
                animation: "pulse 1.2s infinite",
              }} />
              Waiting for confirmation…
            </div>
          </div>
        ) : (
          <>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
              Recipient number (who gets the data)
            </label>
            <input
              type="tel" placeholder="e.g. 0241234567"
              value={recipientPhone}
              onChange={(e) => setRecipient(e.target.value)}
              style={inputStyle}
            />

            <label style={{
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 14, color: "#555", marginBottom: 16, cursor: "pointer",
            }}>
              <input
                type="checkbox" checked={sameNumber}
                onChange={(e) => setSame(e.target.checked)}
                style={{ accentColor: theme.purple, width: 16, height: 16 }}
              />
              Pay from the same number
            </label>

            {!sameNumber && (
              <>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
                  {bundle.network === "mtn" ? "MTN MoMo" : "Telecel Cash"} number to charge
                </label>
                <input
                  type="tel" placeholder="Number to charge"
                  value={payerPhone}
                  onChange={(e) => setPayer(e.target.value)}
                  style={inputStyle}
                />
              </>
            )}

            <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
              Email address (for receipt)
            </label>
            <input
              type="email" placeholder="you@email.com"
              value={payerEmail}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            {error && (
              <div style={{
                background: "#FDE8E8", color: "#8B1A1A",
                borderRadius: 10, padding: "10px 14px",
                fontSize: 13, marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* Summary */}
            <div style={{
              background: theme.purpleLight, borderRadius: 14,
              padding: "14px 18px", marginBottom: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#666" }}>Bundle</span>
                <span style={{ fontWeight: 600 }}>{bundle.data} — {bundle.validity}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#666" }}>Expires in</span>
                <span style={{ fontWeight: 600 }}>{bundle.expiry || "90 days"}</span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 16, fontWeight: 800, marginTop: 8,
                paddingTop: 8, borderTop: "1px solid #D9CFFB",
              }}>
                <span style={{ color: theme.purpleDeep }}>Total</span>
                <span style={{ color: theme.purple }}>{gh(bundle.price)}</span>
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
                Via {bundle.network === "mtn" ? "MTN Mobile Money" : "Telecel Cash"} · SMS receipt included
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{
                padding: "13px 18px", border: "1.5px solid #E8E0FB",
                borderRadius: 12, background: "#fff",
                color: "#666", fontSize: 14, cursor: "pointer",
              }}>
                Cancel
              </button>
              <button onClick={handleBuy} disabled={loading} style={{
                flex: 1, padding: "13px 0",
                background: loading
                  ? "#C4B5F4"
                  : `linear-gradient(135deg, ${theme.purple}, ${theme.purpleDark})`,
                border: "none", borderRadius: 12, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
              }}>
                {loading ? "Processing…" : `Pay ${gh(bundle.price)}`}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

// ── Store View ────────────────────────────────────────────────────────────────
function StoreView({ onBuy }) {
  const [bundles, setBundles] = useState([]);
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/bundles`)
      .then((r) => setBundles(r.data.bundles))
      .finally(() => setLoading(false));
  }, []);

  const visible = bundles.filter((b) => filter === "all" || b.network === filter);

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.purpleDeep}, ${theme.purple})`,
        borderRadius: 24, padding: "32px 24px", marginBottom: 28, color: "#fff",
      }}>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>
          Welcome to
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          DataFlow GH 📶
        </div>
        <div style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>
          Buy MTN & Telecel data bundles instantly.<br />
          Pay with Mobile Money — no app needed.
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "all",     label: "All networks" },
          { key: "telecel", label: "Telecel" },
          { key: "mtn",     label: "MTN" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: "8px 20px", borderRadius: 20, fontSize: 13,
            fontWeight: filter === key ? 700 : 400, cursor: "pointer",
            border: "none",
            background: filter === key ? theme.purple : "#fff",
            color: filter === key ? "#fff" : "#666",
            boxShadow: filter === key
              ? "0 4px 14px rgba(108,62,232,0.3)"
              : "0 2px 8px rgba(0,0,0,0.06)",
            transition: "all .2s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 40, fontSize: 14 }}>
          Loading bundles…
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))",
          gap: 14,
        }}>
          {visible.map((b) => {
            const net = NET[b.network] || {};
            return (
              <div key={b.id} style={{
                background: "#fff", borderRadius: 20, padding: 18,
                boxShadow: "0 2px 16px rgba(108,62,232,0.07)",
                display: "flex", flexDirection: "column", gap: 8,
                transition: "transform .2s, box-shadow .2s",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 28px rgba(108,62,232,0.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 16px rgba(108,62,232,0.07)";
                }}
              >
                <Badge network={b.network} />
                <div style={{ fontSize: 30, fontWeight: 800, color: theme.purpleDeep, lineHeight: 1 }}>
                  {b.data}
                </div>
                <div style={{ fontSize: 12, color: "#999" }}>{b.validity}</div>
                <div style={{ fontSize: 11, color: theme.purpleMid, fontWeight: 600 }}>
                  Expires in {b.expiry || "90 days"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: theme.purple }}>
                  {gh(b.price)}
                </div>
                <button
                  onClick={() => onBuy(b)}
                  style={{
                    marginTop: 4, padding: "10px 0",
                    background: `linear-gradient(135deg, ${theme.purple}, ${theme.purpleDark})`,
                    border: "none", borderRadius: 12, color: "#fff",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(108,62,232,0.3)",
                    transition: "opacity .2s",
                  }}
                  onMouseEnter={e => e.target.style.opacity = "0.85"}
                  onMouseLeave={e => e.target.style.opacity = "1"}
                >
                  Buy now
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Admin View ────────────────────────────────────────────────────────────────
function AdminView({ showToast, adminCreds, onLogout }) {
  const [bundles, setBundles] = useState([]);
  const [orders, setOrders]   = useState([]);
  const [form, setForm]       = useState({
    network: "telecel", data: "", validity: "", price: "", expiry: "90 days",
  });

  const authHeaders = {
    username: adminCreds.username,
    password: adminCreds.password,
  };

  const loadAll = useCallback(() => {
    axios.get(`${API}/api/bundles`).then((r) => setBundles(r.data.bundles));
    axios.get(`${API}/api/orders`).then((r)  => setOrders(r.data.orders));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addBundle = async () => {
    if (!form.data || !form.validity || !form.price) return;
    await axios.post(`${API}/api/bundles`,
      { ...form, price: Number(form.price) },
      { headers: authHeaders }
    );
    setForm({ network: "telecel", data: "", validity: "", price: "", expiry: "90 days" });
    loadAll();
    showToast("Bundle added successfully");
  };

  const removeBundle = async (id) => {
    await axios.delete(`${API}/api/bundles/${id}`, { headers: authHeaders });
    loadAll();
    showToast("Bundle removed");
  };

  const revenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + (o.bundle?.price || 0), 0);

  const thStyle = {
    textAlign: "left", fontSize: 11, fontWeight: 700,
    color: "#999", padding: "0 12px 12px",
    borderBottom: "1.5px solid #F0EAFF",
    textTransform: "uppercase", letterSpacing: "0.05em",
  };
  const tdStyle = {
    padding: "12px 12px",
    borderBottom: "1px solid #FAF8FF",
    color: "#333", fontSize: 13,
  };

  return (
    <div>
      {/* Admin header */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.purpleDeep}, ${theme.purple})`,
        borderRadius: 24, padding: "24px 24px",
        marginBottom: 24, color: "#fff",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Admin dashboard</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>DataFlow GH</div>
        </div>
        <button onClick={onLogout} style={{
          background: "rgba(255,255,255,0.15)", border: "none",
          borderRadius: 10, color: "#fff", padding: "8px 16px",
          fontSize: 13, cursor: "pointer", fontWeight: 600,
        }}>
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: "Total orders",   value: orders.length,                                          icon: "🛒" },
          { label: "Revenue",        value: gh(revenue),                                            icon: "💰" },
          { label: "Active bundles", value: bundles.length,                                         icon: "📦" },
          { label: "Delivered",      value: orders.filter(o => o.status === "delivered").length,    icon: "✅" },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            background: "#fff", borderRadius: 18, padding: "16px 18px",
            boxShadow: "0 2px 16px rgba(108,62,232,0.07)",
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.purpleDeep }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Add bundle */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.purpleDeep, marginBottom: 16 }}>
          Add new bundle
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
        }}>
          <select
            value={form.network}
            onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
            style={{ ...inputStyle, marginBottom: 0 }}
          >
            <option value="telecel">Telecel</option>
            <option value="mtn">MTN</option>
          </select>
          <input placeholder="Data e.g. 2GB" value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            style={{ ...inputStyle, marginBottom: 0 }} />
          <input placeholder="Validity e.g. 7 days" value={form.validity}
            onChange={(e) => setForm((f) => ({ ...f, validity: e.target.value }))}
            style={{ ...inputStyle, marginBottom: 0 }} />
          <input placeholder="Expiry e.g. 90 days" value={form.expiry}
            onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
            style={{ ...inputStyle, marginBottom: 0 }} />
          <input type="number" placeholder="Price GH₵" value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            style={{ ...inputStyle, marginBottom: 0 }} />
          <button onClick={addBundle} style={{
            padding: "12px 0",
            background: `linear-gradient(135deg, ${theme.purple}, ${theme.purpleDark})`,
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>
            + Add bundle
          </button>
        </div>
      </div>

      {/* Bundles table */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.purpleDeep, marginBottom: 16 }}>
          Bundles
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Network", "Data", "Validity", "Expiry", "Price", ""].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bundles.map((b) => (
                <tr key={b.id}>
                  <td style={tdStyle}><Badge network={b.network} /></td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{b.data}</td>
                  <td style={tdStyle}>{b.validity}</td>
                  <td style={tdStyle}>{b.expiry || "90 days"}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: theme.purple }}>{gh(b.price)}</td>
                  <td style={tdStyle}>
                    <button onClick={() => removeBundle(b.id)} style={{
                      background: "#FDE8E8", border: "none", color: "#8B1A1A",
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                      padding: "4px 12px", borderRadius: 8,
                    }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders table */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.purpleDeep, marginBottom: 16 }}>
          Orders
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Reference", "Bundle", "Recipient", "Amount", "Status"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, color: "#bbb", textAlign: "center", padding: 32 }}>
                    No orders yet
                  </td>
                </tr>
              ) : orders.map((o) => {
                const sc = STATUS[o.status] || { bg: "#f0f0f0", color: "#555" };
                return (
                  <tr key={o.reference}>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: "#888" }}>
                      {o.reference}
                    </td>
                    <td style={tdStyle}>
                      <Badge network={o.bundle?.network} />
                      <span style={{ marginLeft: 6, fontWeight: 600 }}>{o.bundle?.data}</span>
                    </td>
                    <td style={tdStyle}>{o.recipientPhone}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: theme.purple }}>
                      {gh(o.bundle?.price || 0)}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 12px",
                        borderRadius: 20, background: sc.bg, color: sc.color,
                      }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]             = useState("store");
  const [buyBundle, setBuyBundle] = useState(null);
  const [toast, setToast]         = useState({ msg: "", type: "success" });
  const [adminCreds, setAdminCreds] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
  }, []);

  const handleSuccess = useCallback((order) => {
    setBuyBundle(null);
    showToast(`✓ ${order.bundle?.data} sent to ${order.recipientPhone}! SMS receipt delivered.`);
  }, [showToast]);

  const handleAdminLogin = (creds) => {
    setAdminCreds(creds);
    setShowAdminLogin(false);
    setTab("admin");
  };

  const handleLogout = () => {
    setAdminCreds(null);
    setTab("store");
  };

  const handleAdminTabClick = () => {
    if (adminCreds) {
      setTab("admin");
    } else {
      setShowAdminLogin(true);
    }
  };

  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  return (
    <div style={{ background: "#F4F0FF", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        background: "#fff", padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 16px rgba(108,62,232,0.08)",
      }}>
        <div style={{
          fontSize: 18, fontWeight: 800, color: theme.purple,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          📶 DataFlow GH
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("store")} style={{
            padding: "8px 18px", borderRadius: 10, fontSize: 13,
            fontWeight: tab === "store" ? 700 : 400, cursor: "pointer",
            border: "none",
            background: tab === "store" ? theme.purpleLight : "transparent",
            color: tab === "store" ? theme.purple : "#888",
            transition: "all .2s",
          }}>
            Store
          </button>
          <button onClick={handleAdminTabClick} style={{
            padding: "8px 18px", borderRadius: 10, fontSize: 13,
            fontWeight: tab === "admin" ? 700 : 400, cursor: "pointer",
            border: "none",
            background: tab === "admin" ? theme.purpleLight : "transparent",
            color: tab === "admin" ? theme.purple : "#888",
            transition: "all .2s",
          }}>
            Admin
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        {tab === "store" && <StoreView onBuy={setBuyBundle} />}
        {tab === "admin" && adminCreds && (
          <AdminView
            showToast={showToast}
            adminCreds={adminCreds}
            onLogout={handleLogout}
          />
        )}
      </div>

      {buyBundle && (
        <BuyModal
          bundle={buyBundle}
          onClose={() => setBuyBundle(null)}
          onSuccess={handleSuccess}
        />
      )}

      <Toast msg={toast.msg} type={toast.type} onDone={() => setToast({ msg: "" })} />
    </div>
  );
}