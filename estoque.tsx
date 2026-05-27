import { useState, useEffect } from "react";

const ROLES = {
  producao_a: { label: "Produção A", color: "#4ade80", icon: "🏭", action: "add", password: "mukli1" },
  producao_b: { label: "Produção B", color: "#60a5fa", icon: "🔧", action: "add", password: "mukli2" },
  entregador: { label: "Entregador", color: "#fb923c", icon: "🚚", action: "remove", password: "mukli3" },
  dono: { label: "Dono", color: "#e879f9", icon: "👑", action: "view", password: "muklidono" },
};

const PRODUCTS = ["Drágeas ao leite 100g", "Drágeas branco 100g", "Drágeas mistas 100g", "Drágeas mistas 200g"];

const initialStock = () => PRODUCTS.reduce((acc, p) => ({ ...acc, [p]: 0 }), {});

export default function App() {
  const [step, setStep] = useState("select"); // select | password
  const [selectedRole, setSelectedRole] = useState(null);
  const [role, setRole] = useState(null);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [stock, setStock] = useState(initialStock);
  const [log, setLog] = useState([]);
  const [qtys, setQtys] = useState(PRODUCTS.reduce((a, p) => ({ ...a, [p]: 1 }), {}));
  const [feedback, setFeedback] = useState(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await window.storage.get("stock");
        if (s) setStock(JSON.parse(s.value));
        const l = await window.storage.get("log");
        if (l) setLog(JSON.parse(l.value));
      } catch (_) {}
    };
    load();
  }, []);

  const saveStock = async (v) => { try { await window.storage.set("stock", JSON.stringify(v)); } catch (_) {} };
  const saveLog = async (v) => { try { await window.storage.set("log", JSON.stringify(v.slice(0, 100))); } catch (_) {} };

  const flash = (msg, ok = true) => {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 2200);
  };

  const handleSelectRole = (key) => {
    setSelectedRole(key);
    setPwInput("");
    setPwError(false);
    setShowPw(false);
    setStep("password");
  };

  const handleLogin = () => {
    if (pwInput === ROLES[selectedRole].password) {
      setRole(selectedRole);
      setStep("app");
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput("");
    }
  };

  const handleLogout = () => {
    setRole(null);
    setSelectedRole(null);
    setStep("select");
    setPwInput("");
    setPwError(false);
  };

  const handleAction = (product) => {
    const qty = Number(qtys[product]);
    if (!qty || qty < 1) return flash("Informe uma quantidade válida.", false);
    setStock((prev) => {
      const next = { ...prev };
      if (ROLES[role].action === "add") {
        next[product] = (next[product] || 0) + qty;
      } else {
        if ((next[product] || 0) < qty) {
          flash(`Estoque insuficiente para ${product}!`, false);
          return prev;
        }
        next[product] = next[product] - qty;
      }
      saveStock(next);
      const entry = {
        id: Date.now(),
        time: new Date().toLocaleTimeString("pt-BR"),
        date: new Date().toLocaleDateString("pt-BR"),
        role: ROLES[role].label,
        product, qty,
        type: ROLES[role].action,
        stock: next[product],
      };
      setLog((prev) => {
        const updated = [entry, ...prev];
        saveLog(updated);
        return updated;
      });
      flash(ROLES[role].action === "add" ? `+${qty} de ${product} adicionado!` : `-${qty} de ${product} retirado!`, true);
      return next;
    });
  };

  const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
  const r = role ? ROLES[role] : null;

  // TELA 1: Seleção de perfil
  if (step === "select") {
    return (
      <div style={styles.screen}>
        <div style={styles.loginBox}>
          <div style={styles.logo}>📦</div>
          <h1 style={styles.title}>Controle de Estoque</h1>
          <p style={styles.subtitle}>Selecione seu perfil</p>
          <div style={styles.roleGrid}>
            {Object.entries(ROLES).map(([key, r]) => (
              <button key={key} style={{ ...styles.roleBtn, borderColor: r.color }} onClick={() => handleSelectRole(key)}>
                <span style={styles.roleIcon}>{r.icon}</span>
                <span style={{ ...styles.roleLabel, color: r.color }}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // TELA 2: Senha
  if (step === "password") {
    const sr = ROLES[selectedRole];
    return (
      <div style={styles.screen}>
        <div style={styles.loginBox}>
          <div style={styles.logo}>{sr.icon}</div>
          <h1 style={{ ...styles.title, color: sr.color }}>{sr.label}</h1>
          <p style={styles.subtitle}>Digite sua senha para entrar</p>
          <div style={styles.pwWrapper}>
            <input
              type={showPw ? "text" : "password"}
              placeholder="Senha"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ ...styles.pwInput, borderColor: pwError ? "#ef4444" : "#2a2a35" }}
              autoFocus
            />
            <button style={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>{showPw ? "🙈" : "👁️"}</button>
          </div>
          {pwError && <div style={styles.pwError}>Senha incorreta. Tente novamente.</div>}
          <button style={{ ...styles.enterBtn, background: sr.color }} onClick={handleLogin}>Entrar</button>
          <button style={styles.backBtn} onClick={() => setStep("select")}>← Voltar</button>
        </div>
      </div>
    );
  }

  // TELA 3: App
  return (
    <div style={styles.screen}>
      {feedback && (
        <div style={{ ...styles.toast, background: feedback.ok ? "#22c55e" : "#ef4444" }}>{feedback.msg}</div>
      )}
      <div style={{ ...styles.header, borderBottom: `3px solid ${r.color}` }}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>{r.icon}</span>
          <span style={{ ...styles.headerRole, color: r.color }}>{r.label}</span>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>← Sair</button>
      </div>

      <div style={styles.content}>
        {role === "dono" && (
          <>
            <div style={styles.ownerTitle}>📊 Painel do Dono</div>
            <div style={styles.totalBadge}>Total em estoque: <strong>{totalStock} unidades</strong></div>
            <div style={styles.stockGrid}>
              {PRODUCTS.map((p) => (
                <div key={p} style={styles.stockCard}>
                  <div style={styles.stockProduct}>{p}</div>
                  <div style={{ ...styles.stockQty, color: stock[p] === 0 ? "#ef4444" : "#4ade80" }}>{stock[p]}</div>
                  <div style={styles.stockUnit}>unidades</div>
                </div>
              ))}
            </div>
            <div style={styles.logSection}>
              <div style={styles.logTitle}>📋 Histórico de Movimentações</div>
              {log.length === 0 ? (
                <div style={styles.emptyLog}>Nenhuma movimentação ainda.</div>
              ) : (
                <div style={styles.logList}>
                  {log.map((entry) => (
                    <div key={entry.id} style={styles.logEntry}>
                      <span style={{ color: entry.type === "add" ? "#4ade80" : "#fb923c", fontSize: 18 }}>
                        {entry.type === "add" ? "▲" : "▼"}
                      </span>
                      <span style={styles.logText}>
                        <strong>{entry.product}</strong> — {entry.type === "add" ? "+" : "-"}{entry.qty} un.
                        <span style={styles.logMeta}> por {entry.role} · {entry.date} {entry.time} · estoque: {entry.stock}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {role !== "dono" && (
          <>
            <div style={styles.actionTitle}>
              {r.action === "add" ? "➕ Adicionar ao Estoque" : "➖ Retirar do Estoque"}
            </div>
            <div style={styles.productList}>
              {PRODUCTS.map((p) => (
                <div key={p} style={styles.productRow}>
                  <div style={styles.productInfo}>
                    <span style={styles.productName}>{p}</span>
                    <span style={styles.productStock}>{stock[p]} em estoque</span>
                  </div>
                  <div style={styles.productActions}>
                    <input
                      type="number" min={1} value={qtys[p]}
                      onChange={(e) => setQtys((prev) => ({ ...prev, [p]: e.target.value }))}
                      style={styles.qtyInput}
                    />
                    <button
                      style={{ ...styles.actionBtn, background: r.action === "add" ? "#4ade80" : "#fb923c" }}
                      onClick={() => handleAction(p)}
                    >
                      {r.action === "add" ? "Adicionar" : "Retirar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  screen: { minHeight: "100vh", background: "#0f0f13", color: "#f1f1f1", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 40 },
  loginBox: { marginTop: 80, background: "#1a1a24", borderRadius: 20, padding: "40px 32px", maxWidth: 400, width: "90%", boxShadow: "0 8px 40px #0008", textAlign: "center" },
  logo: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#888", fontSize: 14, marginBottom: 28 },
  roleGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  roleBtn: { background: "#12121a", border: "2px solid", borderRadius: 14, padding: "18px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  roleIcon: { fontSize: 28 },
  roleLabel: { fontWeight: 700, fontSize: 13 },
  pwWrapper: { position: "relative", marginBottom: 8 },
  pwInput: { width: "100%", background: "#12121a", border: "2px solid", color: "#fff", borderRadius: 10, padding: "12px 44px 12px 16px", fontSize: 16, boxSizing: "border-box", outline: "none" },
  eyeBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18 },
  pwError: { color: "#ef4444", fontSize: 13, marginBottom: 12 },
  enterBtn: { width: "100%", border: "none", borderRadius: 10, padding: "13px", fontWeight: 800, fontSize: 15, cursor: "pointer", color: "#111", marginBottom: 10 },
  backBtn: { background: "none", border: "none", color: "#666", fontSize: 13, cursor: "pointer" },
  toast: { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: 30, fontWeight: 700, fontSize: 14, color: "#fff", zIndex: 1000, boxShadow: "0 4px 20px #0006" },
  header: { width: "100%", maxWidth: 600, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", marginTop: 20, background: "#1a1a24", borderRadius: "16px 16px 0 0" },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerIcon: { fontSize: 24 },
  headerRole: { fontWeight: 800, fontSize: 18 },
  logoutBtn: { background: "none", border: "1px solid #444", color: "#aaa", borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 13 },
  content: { width: "100%", maxWidth: 600, background: "#1a1a24", borderRadius: "0 0 16px 16px", padding: "24px" },
  ownerTitle: { fontSize: 20, fontWeight: 800, marginBottom: 16 },
  totalBadge: { background: "#12121a", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 14, color: "#ccc" },
  stockGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 28 },
  stockCard: { background: "#12121a", borderRadius: 12, padding: "16px", textAlign: "center", border: "1px solid #2a2a35" },
  stockProduct: { fontSize: 13, color: "#aaa", marginBottom: 6 },
  stockQty: { fontSize: 36, fontWeight: 900 },
  stockUnit: { fontSize: 11, color: "#555", marginTop: 2 },
  logSection: {},
  logTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#ccc" },
  emptyLog: { color: "#555", fontSize: 13, textAlign: "center", padding: 20 },
  logList: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" },
  logEntry: { background: "#12121a", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13 },
  logText: { lineHeight: 1.5 },
  logMeta: { color: "#666", fontSize: 11 },
  actionTitle: { fontSize: 18, fontWeight: 800, marginBottom: 20 },
  productList: { display: "flex", flexDirection: "column", gap: 12 },
  productRow: { background: "#12121a", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  productInfo: { display: "flex", flexDirection: "column", gap: 3 },
  productName: { fontWeight: 700, fontSize: 15 },
  productStock: { color: "#777", fontSize: 12 },
  productActions: { display: "flex", gap: 8, alignItems: "center" },
  qtyInput: { width: 60, background: "#1e1e2a", border: "1px solid #333", color: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 14, textAlign: "center" },
  actionBtn: { border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#111" },
};
