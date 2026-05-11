// @ts-nocheck
import { useState, useEffect } from "react";
import { api, saveTokens, clearTokens } from "./api";

// ─── THEME ───────────────────────────────────────────────────────────────────
// ─── FEDAPAY CONFIG ──────────────────────────────────────────────────────────
// const FEDAPAY_PUBLIC_KEY = (import.meta as any).env?.VITE_FEDAPAY_PUBLIC_KEY || '';

const C = {
  primary: "#16a34a", primaryDark: "#0f7a36", primaryLight: "#22c55e",
  accent: "#f59e0b", danger: "#ef4444", blue: "#3b82f6", purple: "#7c3aed",
  bg: "#c4b5fd", bgCard: "#f0ebff", bgCard2: "#e9e0ff",
  border: "#d1fae5", borderGray: "#e5e7eb",
  text: "#111827", muted: "#6b7280", mutedLight: "#9ca3af",
};

// ─── PAYS ────────────────────────────────────────────────────────────────────
const COUNTRY_NETWORKS: Record<string, string[]> = {
  "Bénin": ["MTN Mobile Money", "Moov Money"],
  "Burkina Faso": ["Orange Money", "Moov Money"],
  "Cameroun": ["MTN Mobile Money", "Orange Money"],
  "Côte d'Ivoire": ["Orange Money", "MTN Money", "Moov Money", "Wave"],
  "Congo-Brazzaville": ["Airtel Money", "MTN Mobile Money"],
  "Mali": ["Orange Money", "Moov Money"],
  "Sénégal": ["Orange Money", "Free Money", "Wave"],
  "Togo": ["TMoney", "Flooz"],
};
const COUNTRIES = Object.keys(COUNTRY_NETWORKS);

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Transaction {
  id: string; type: "depot" | "retrait" | "tache" | "roue" | "parrainage" | "bonus";
  amount: number; method?: string; date: string; status: "en attente" | "validé" | "payé" | "rejeté";
  description: string;
}
interface UserState {
  username: string; email: string; phone: string; country: string; sponsor: string; password: string;
  isActive: boolean; activatedAt: string; balance: number; totalProfit: number;
  totalWithdrawn: number; welcomeBonus: number; referrals: number;
  taskDoneToday: boolean; taskLastDate: string; wheelUsed: boolean; wheelLastUsed: string;
  taskWheelLastUsed: string;
  transactions: Transaction[];
}

// ─── COMPOSANTS DE BASE ──────────────────────────────────────────────────────
const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const s = size === "sm" ? 30 : size === "lg" ? 48 : 36;
  const fs = size === "sm" ? 11 : size === "lg" ? 18 : 13;
  const ts = size === "sm" ? 15 : size === "lg" ? 22 : 17;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: s, height: s, borderRadius: "50%", background: `linear-gradient(135deg,${C.primaryLight},${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: fs, color: "#fff", boxShadow: `0 3px 10px ${C.primary}55`, flexShrink: 0 }}>DF</div>
      <span style={{ fontWeight: 800, fontSize: ts, color: C.primaryDark, letterSpacing: 1.5, fontFamily: "Georgia, serif" }}>GOLDEN FORTUNE</span>
    </div>
  );
};

const Input = ({ label, type = "text", placeholder = "", value, onChange, disabled = false, icon = "" }: any) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>{label}</label>}
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>{icon}</span>}
      <input type={type} placeholder={placeholder} value={value} onChange={(e: any) => onChange(e.target.value)} disabled={disabled}
        style={{ width: "100%", boxSizing: "border-box" as const, background: disabled ? C.bgCard2 : "#fff", border: `1.5px solid ${C.borderGray}`, borderRadius: 12, padding: icon ? "11px 14px 11px 38px" : "11px 14px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
    </div>
  </div>
);

const Btn = ({ children, onClick, color = C.primary, disabled = false, style = {}, outline = false, small = false }: any) => (
  <button onClick={onClick} disabled={disabled}
    style={{ width: "100%", padding: small ? "8px 14px" : "12px 16px", background: outline ? "transparent" : disabled ? "#d1d5db" : color, border: outline ? `2px solid ${disabled ? "#d1d5db" : color}` : "none", borderRadius: 12, color: outline ? (disabled ? "#d1d5db" : color) : "#fff", fontSize: small ? 12 : 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.75 : 1, fontFamily: "inherit", ...style }}>
    {children}
  </button>
);

const Card = ({ children, style = {}, onClick = undefined }: any) => (
  <div onClick={onClick} style={{ background: C.bgCard, border: `1.5px solid ${C.borderGray}`, borderRadius: 16, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
);

const Badge = ({ children, color = C.primary }: any) => (
  <span style={{ background: color + "18", color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-block" }}>{children}</span>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: any = { "validé": C.primary, "payé": C.primary, "en attente": C.accent, "rejeté": C.danger };
  return <Badge color={map[status] || C.muted}>{status}</Badge>;
};

const Select = ({ label, value, onChange, options }: any) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>{label}</label>}
    <div style={{ position: "relative" }}>
      <select value={value} onChange={(e: any) => onChange(e.target.value)}
        style={{ width: "100%", appearance: "none" as const, background: "#fff", border: `1.5px solid ${C.borderGray}`, borderRadius: 12, padding: "11px 38px 11px 14px", color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
        {options.map((o: any) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: C.muted, fontSize: 12 }}>▼</div>
    </div>
  </div>
);

const StatCard = ({ label, value, bg, border, iconBg, icon, mb = 12 }: any) => (
  <div style={{ background: bg, borderRadius: 16, padding: "18px 20px", marginBottom: mb, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1.5px solid ${border}` }}>
    <div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{value}</div>
    </div>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
  </div>
);

const ReferralLink = ({ username }: any) => {
  const [copied, setCopied] = useState(false);
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://goldenfortune.com';
  const link = `${base}/?ref=${encodeURIComponent(username || "moncode")}`;
  const copy = () => {
    try { navigator.clipboard.writeText(link); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Copier le lien de parrainage.</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, background: "#f9fafb", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{link}</div>
        <button onClick={copy} style={{ background: copied ? C.primaryDark : C.primary, border: "none", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
    </div>
  );
};

// ─── ICÔNES ──────────────────────────────────────────────────────────────────
const IconWallet = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>;
const IconWithdraw = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 7l-5-5-5 5"/><path d="M7 17l5 5 5-5"/></svg>;
const IconGift = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
const IconUsers = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// ─── FORMAT DATE ─────────────────────────────────────────────────────────────
const fmtDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const typeLabel: any = { depot: "Dépôt", retrait: "Retrait", tache: "Tâche", roue: "Roue de fortune", parrainage: "Parrainage", bonus: "Bonus" };
const typeIcon: any = { depot: "💳", retrait: "💸", tache: "📋", roue: "🎰", parrainage: "🤝", bonus: "🎁" };
const typeColor: any = { depot: C.blue, retrait: "#f97316", tache: C.primary, roue: C.accent, parrainage: C.purple, bonus: "#ec4899" };

// ─────────────────────────────────────────────────────────────────────────────
// ─── LOGIN ───────────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin, onRegister, onForgot, isRegistered }: any) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async () => {
    if (!username || !password) { setError("Veuillez remplir tous les champs."); return; }
    const result = await onLogin("user", username, password);
    if (result === false) setError("Nom d'utilisateur ou mot de passe incorrect.");
    else setError("");
  };
  return (
    <div style={{ minHeight: "100vh", background: "#c4b5fd", display: "flex", flexDirection: "column", padding: "0 24px" }}>
      <div style={{ paddingTop: 60, paddingBottom: 36, textAlign: "center" }}>
        <Logo size="lg" />
        <p style={{ color: C.muted, marginTop: 10, fontSize: 14 }}>Votre espace de revenus en ligne</p>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Se connecter</h2>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 28px" }}>Accédez à votre compte Golden Fortune</p>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 14, color: C.text, marginBottom: 8, fontWeight: 500 }}>Nom d'utilisateur</label>
        <input type="text" placeholder="Votre identifiant" value={username} onChange={(e: any) => setUsername(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" as const, background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 10, padding: "14px 16px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 14, color: C.text, marginBottom: 8, fontWeight: 500 }}>Mot de passe</label>
        <input type="password" placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" as const, background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 10, padding: "14px 16px", color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
      </div>
      <div style={{ textAlign: "right", marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: "#3b82f6", cursor: "pointer", fontWeight: 500 }} onClick={onForgot}>Mot de passe oublié ?</span>
      </div>
      {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>⚠️ {error}</div>}
      <button onClick={submit} style={{ width: "100%", padding: "14px", background: "#3b82f6", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>
        Se connecter
      </button>
      <p style={{ textAlign: "center", fontSize: 14, color: C.muted, margin: "0 0 12px" }}>
        Pas encore de compte ?{" "}
        <span style={{ color: "#3b82f6", cursor: "pointer", fontWeight: 700 }} onClick={onRegister}>S'inscrire</span>
      </p>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 11, color: C.mutedLight }}></span>
      </div>
    </div>
  );
};

// ─── INSCRIPTION ─────────────────────────────────────────────────────────────
const RegisterScreen = ({ onDone, onBack, existingEmails = [], initialSponsor = "" }: any) => {
  const [email, setEmail] = useState(""); const [username, setUsername] = useState("");
  const [country, setCountry] = useState("Togo"); const [phone, setPhone] = useState("");
  const [sponsor, setSponsor] = useState(initialSponsor || ""); const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(""); const [checked, setChecked] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const submit = async () => {
    const errs: string[] = [];
    if (!email || !username || !phone || !password) errs.push("Tous les champs obligatoires doivent être remplis.");
    if (password && confirm && password !== confirm) errs.push("Les mots de passe ne correspondent pas.");
    if (!checked) errs.push("Vous devez accepter les conditions générales.");
    if (existingEmails.includes(email)) errs.push("Cet email est déjà utilisé. Veuillez vous connecter.");
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    try { await onDone({ phone, username, email, country, sponsor, password }, (msg: string) => setErrors([msg])); }
    catch (e: any) { setErrors([e.message || "Erreur lors de l’inscription."]); }
  };
  return (
    <div style={{ padding: "24px 20px 40px", background: C.bg, minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.muted }}>‹</button><Logo />
      </div>
      <h2 style={{ margin: "0 0 4px", fontWeight: 800 }}>Créer un compte</h2>
      <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>Rejoignez Golden Fortune et commencez à gagner 🚀</p>
      <Card style={{ padding: "22px 20px" }}>
        <Input label="Adresse e-mail *" placeholder="ton@email.com" value={email} onChange={setEmail} icon="📧" />
        <Input label="Nom d'utilisateur *" placeholder="tonpseudo" value={username} onChange={setUsername} icon="👤" />
        <Select label="🌍 Pays *" value={country} onChange={setCountry} options={COUNTRIES} />
        <Input label="Numéro de téléphone *" placeholder="+228 XX XX XX XX" value={phone} onChange={setPhone} icon="📱" />
        <Input label="Code parrain (optionnel)" placeholder="Username du parrain" value={sponsor} onChange={setSponsor} icon="🤝" />
        {initialSponsor && <div style={{ fontSize: 12, color: C.primary, marginTop: -8, marginBottom: 12 }}>✅ Code parrain détecté depuis le lien : <strong>{initialSponsor}</strong></div>}
        <Input label="Mot de passe *" type="password" placeholder="Min. 8 caractères" value={password} onChange={setPassword} icon="🔒" />
        <Input label="Confirmer le mot de passe *" type="password" placeholder="••••••••" value={confirm} onChange={setConfirm} icon="🔒" />
        {confirm && password !== confirm && <div style={{ fontSize: 12, color: C.danger, marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 }}>⚠️ Mots de passe différents.</div>}
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", marginBottom: 16, padding: 12, background: "#f0fdf4", borderRadius: 10 }}>
          <input type="checkbox" checked={checked} onChange={(e: any) => setChecked(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: C.primary }} />
          <span style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Je confirme avoir <strong>18 ans</strong> et j'accepte les conditions générales.</span>
        </label>
        {errors.length > 0 && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>{errors.map((e, i) => <div key={i} style={{ fontSize: 13, color: C.danger }}>⚠️ {e}</div>)}</div>}
        <Btn onClick={submit}>Créer mon compte</Btn>
      </Card>
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: C.muted }}>
        Vous avez déjà un compte ?{" "}
        <span style={{ color: "#3b82f6", cursor: "pointer", fontWeight: 700 }} onClick={onBack}>Se connecter</span>
      </p>
    </div>
  );
};

// ─── MOT DE PASSE OUBLIÉ ─────────────────────────────────────────────────────
const ForgotPasswordScreen = ({ onBack, accounts, onDirectReset }: any) => {
  const [step, setStep] = useState<"email" | "code" | "reset">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [sending, setSending] = useState(false);

  // Génère un code à 6 chiffres et l'envoie uniquement par email
  const sendCode = async () => {
    if (!email || !email.includes("@")) { setError("Veuillez entrer une adresse email valide."); return; }
    const found = accounts?.find((a: any) => a.email === email) || { username: email };
    setError(""); setSending(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: "service_jkoj1vp",
          template_id: "template_ix56jrl",
          user_id: "0HsefQrzGeOfL9sbT",
          template_params: {
            to_email: email,
            email: email,
            username: found.username || email,
            to_name: found.username || email,
            reset_code: code,
            app_name: "Golden Fortune",
            title: `Code de vérification : ${code}`,
            name: found.username || email,
            message: `Votre code de réinitialisation Golden Fortune est : ${code}`
          }
        })
      });
      if (res.ok) {
        setSending(false);
        setStep("code");
      } else {
        const txt = await res.text();
        setSending(false);
        setError(`Erreur envoi email (${res.status}): ${txt}. Code temporaire : ${code}`);
      }
    } catch (err: any) {
      setSending(false);
      setError(`Erreur réseau : ${err?.message || err}. Code temporaire : ${code}`);
    }
  };

  const verifyCode = () => {
    if (enteredCode.trim() !== generatedCode) { setError("Code incorrect. Vérifiez votre boîte email."); return; }
    setError(""); setStep("reset");
  };

  const resetPassword = () => {
    if (newPassword.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (newPassword !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setError("");
    onDirectReset(email, newPassword);
    setSuccess(true);
  };

  if (success) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "3px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20 }}>✅</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 10px" }}>Mot de passe réinitialisé !</h2>
      <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px", lineHeight: 1.6, maxWidth: 300 }}>Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.</p>
      <button onClick={onBack} style={{ width: "100%", maxWidth: 320, padding: "14px", background: C.primary, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        Se connecter
      </button>
    </div>
  );

  // ── Étape 3 : nouveau mot de passe ──
  if (step === "reset") return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", padding: "0 24px" }}>
      <div style={{ paddingTop: 56, paddingBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setStep("code")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#64748b", padding: 0 }}>‹</button>
        <span style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>Retour</span>
      </div>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔑</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>Nouveau mot de passe</h2>
      <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
        Définissez un nouveau mot de passe pour <strong>{email}</strong>.
      </p>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 14, color: "#1e293b", marginBottom: 8, fontWeight: 500 }}>Nouveau mot de passe</label>
        <input type="password" placeholder="Min. 8 caractères" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" as const, background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 10, padding: "14px 16px", color: "#1e293b", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 14, color: "#1e293b", marginBottom: 8, fontWeight: 500 }}>Confirmer le mot de passe</label>
        <input type="password" placeholder="••••••••" value={confirm} onChange={(e: any) => setConfirm(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" as const, background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 10, padding: "14px 16px", color: "#1e293b", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
      </div>
      {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>⚠️ {error}</div>}
      <button onClick={resetPassword} style={{ width: "100%", padding: "14px", background: C.primary, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        Réinitialiser le mot de passe
      </button>
    </div>
  );

  // ── Étape 2 : saisie du code reçu par email ──
  if (step === "code") return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", padding: "0 24px" }}>
      <div style={{ paddingTop: 56, paddingBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => { setStep("email"); setEnteredCode(""); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#64748b", padding: 0 }}>‹</button>
        <span style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>Retour</span>
      </div>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>Vérifiez votre email</h2>
      <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
        Un code de vérification à 6 chiffres a été envoyé à <strong>{email}</strong>. Ouvrez votre boîte email, copiez le code et collez-le ici.
      </p>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 14, color: "#1e293b", marginBottom: 8, fontWeight: 500 }}>Code de vérification</label>
        <input
          type="text" inputMode="numeric" maxLength={6} placeholder="_ _ _ _ _ _"
          value={enteredCode} onChange={(e: any) => setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e: any) => e.key === "Enter" && verifyCode()}
          style={{ width: "100%", boxSizing: "border-box" as const, background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 10, padding: "16px", color: "#1e293b", fontSize: 22, fontWeight: 800, letterSpacing: 10, textAlign: "center", outline: "none", fontFamily: "monospace" }} />
      </div>
      {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>⚠️ {error}</div>}
      <button onClick={verifyCode} style={{ width: "100%", padding: "14px", background: "#3b82f6", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
        Vérifier le code
      </button>
      <button onClick={sendCode} style={{ width: "100%", padding: "12px", background: "transparent", border: "1.5px solid #d1d5db", borderRadius: 10, color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
        🔄 Renvoyer le code
      </button>
    </div>
  );

  // ── Étape 1 : saisie email ──
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", padding: "0 24px" }}>
      <div style={{ paddingTop: 56, paddingBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#64748b", padding: 0 }}>‹</button>
        <span style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>Retour</span>
      </div>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>Mot de passe oublié ?</h2>
      <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px", lineHeight: 1.6 }}>
        Entrez l'adresse email de votre compte. Nous vous enverrons un code de vérification.
      </p>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 14, color: "#1e293b", marginBottom: 8, fontWeight: 500 }}>Adresse email</label>
        <input type="email" placeholder="exemple@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)}
          onKeyDown={(e: any) => e.key === "Enter" && sendCode()}
          style={{ width: "100%", boxSizing: "border-box" as const, background: "#fff", border: "1.5px solid #d1d5db", borderRadius: 10, padding: "14px 16px", color: "#1e293b", fontSize: 14, outline: "none", fontFamily: "inherit" }} />
      </div>
      {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "#fef2f2", borderRadius: 10, border: "1px solid #fecaca" }}>⚠️ {error}</div>}
      <button onClick={sendCode} disabled={sending} style={{ width: "100%", padding: "14px", background: sending ? "#94a3b8" : "#3b82f6", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
        {sending ? "Envoi en cours…" : "📧 Envoyer le code"}
      </button>
    </div>
  );
};

const ActivationScreen = ({ user, onActivationDeposit }: any) => {
  const networks = COUNTRY_NETWORKS[user.country] || ["TMoney", "Flooz"];
  const [chain, setChain] = useState(networks[0]);
  const [step, setStep] = useState("form");
  const [showBanner, setShowBanner] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ACTIVATION_AMOUNT = 3500;
  const canPay = chain !== "";

const launchFedaPay = async () => {
  if (!canPay) {
    setError("Veuillez sélectionner un moyen de paiement.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const txRef = `activation-${Date.now()}`;

    const res = await api.deposit(
      ACTIVATION_AMOUNT,
      chain,
      txRef
    );

    // Backend moderne : redirection FedaPay
    if (res?.payment_url) {
      window.location.href = res.payment_url;
      return;
    }

    // Fallback local
    onActivationDeposit(
      ACTIVATION_AMOUNT,
      chain,
      txRef
    );

    setStep("pending");

  } catch (e: any) {
    setError(
      e?.message || "Erreur lors de l'initialisation du paiement."
    );
  } finally {
    setLoading(false);
  }
};

  if (step === "pending") return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#ecfdf5", border: "3px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 20 }}>✅</div>
      <h3 style={{ color: C.success, margin: "0 0 10px", fontSize: 20, fontWeight: 800 }}>Compte activé automatiquement</h3>
      <p style={{ color: C.muted, maxWidth: 300, lineHeight: 1.7, margin: "0 0 32px", fontSize: 14 }}>Votre paiement a été enregistré. Vous pouvez maintenant utiliser toutes les fonctionnalités.</p>
      <div style={{ width: "100%", maxWidth: 320 }}><Btn onClick={() => window.location.reload()}>Continuer</Btn></div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#c4b5fd", maxWidth: 420, margin: "0 auto" }}>
      <div style={{ padding: "14px 16px", background: C.bg, borderBottom: `1px solid ${C.borderGray}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, cursor: "pointer" }}>{[0,1,2].map(i => <div key={i} style={{ width: 22, height: 2, background: C.text, borderRadius: 2 }} />)}</div>
        <Logo size="sm" />
      </div>
      <div style={{ padding: "20px 16px" }}>
        <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 20 }}>Compte de recharge</h2>
        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px", lineHeight: 1.5 }}>Approvisionnez votre portefeuille via les canaux de paiement pris en charge.</p>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, border: `1.5px solid ${C.borderGray}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16, background: C.bg }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${C.borderGray}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.muted, fontSize: 18 }}>ⓘ</div>
          <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Compte inactif</div><div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Veuillez vous abonner pour activer votre compte.</div></div>
        </div>
        {showBanner && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#e8f4fd", border: "1px solid #b3d4f0", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
            <div><div style={{ fontSize: 12, color: "#2563a8", marginBottom: 2 }}>Utilisez ce numéro pour les dépôts :</div><div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{user.phone || "+228 XX XX XX XX"}</div></div>
            <button onClick={() => setShowBanner(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 20 }}>✕</button>
          </div>
        )}
        <Card style={{ padding: "20px 16px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}>Argent mobile (STK)</h3>
          <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>Initiez le paiement directement sur votre téléphone</p>
          <Select label="Sélectionner la chaîne" value={chain} onChange={setChain} options={networks} />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Numéro de portefeuille</label>
            <input value={user.phone || ""} readOnly style={{ width: "100%", boxSizing: "border-box" as const, background: "#f9fafb", border: `1.5px solid ${C.borderGray}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 15, fontWeight: 600, outline: "none", fontFamily: "inherit" }} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>🔒 Numéro utilisé lors de votre inscription</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Montant</label>
            <div style={{ display: "flex", border: `1.5px solid ${C.borderGray}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#f3f4f6", padding: "12px 14px", fontSize: 14, fontWeight: 700, color: C.muted, borderRight: `1.5px solid ${C.borderGray}`, minWidth: 56, textAlign: "center" }}>XOF</div>
              <input type="number" readOnly value={ACTIVATION_AMOUNT}
                style={{ flex: 1, border: "none", padding: "12px 14px", fontSize: 16, fontWeight: 700, color: C.text, background: "#f9fafb", outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>💡 Frais d'activation fixes — non modifiable</div>
          </div>
          {error && <div style={{ color: C.danger, fontSize: 13, marginBottom: 12, padding: "10px 14px", background: "#fef2f2", borderRadius: 10 }}>⚠️ {error}</div>}
          <Btn onClick={launchFedaPay} disabled={loading || !canPay}>
            {loading ? "Chargement..." : `💳 Payer ${ACTIVATION_AMOUNT.toLocaleString()} XOF avec ${chain}`}
          </Btn>
          <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 10 }}>
            🔒 Paiement sécurisé par FedaPay
          </p>
        </Card>
      </div>
    </div>
  );
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const DashboardScreen = ({ user, go }: any) => {
  const last3 = [...(user.transactions || [])].reverse().slice(0, 3);
  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "20px 16px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 22 }}>Tableau de bord</h2>
        <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 18 }}>Bienvenue {user.username} 🎉</p>
        <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Sur GoldenFortune, accédez à une gamme de revenus adaptés à vos BESOINS 🔥</p>
      </div>

      <div style={{ background: C.primary, borderRadius: 16, padding: "18px 20px", marginBottom: 14, display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>XOF 3 500</div>
          <div style={{ fontSize: 12, color: "#d1fae5" }}>Dépense totale</div>
        </div>
        <div style={{ width: 1, background: "#ffffff55", alignSelf: "stretch", margin: "0 8px" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>XOF {(user.totalProfit || 0).toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#d1fae5" }}>Profit total</div>
        </div>
      </div>

      <StatCard label="Solde du compte" value={`XOF ${(user.balance || 0).toLocaleString()}`} bg="#e8fdf0" border="#bbf7d0" iconBg={C.primary} icon={<IconWallet />} />
      <StatCard label="Total retiré" value={`XOF ${(user.totalWithdrawn || 0).toLocaleString()}`} bg="#fff3ec" border="#fed7aa" iconBg="#f97316" icon={<IconWithdraw />} />
      <StatCard label={`Bonus bienvenue ${user.welcomeBonus ? "✅" : `(${user.referrals||0}/25 filleuls)`}`} value={user.welcomeBonus ? `XOF ${user.welcomeBonus.toLocaleString()}` : "En attente"} bg="#f0edfb" border="#ddd6fe" iconBg="#7c3aed" icon={<IconGift />} />
      <StatCard label="Filleuls actifs" value={String(user.referrals || 0)} bg="#eff6ff" border="#bfdbfe" iconBg="#2563eb" icon={<IconUsers />} mb={20} />

      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Accès rapide</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { icon: "🎰", label: "Roue de fortune", page: "wheel", color: "#f59e0b", bg: "#fffbeb" },
          { icon: "📋", label: "Tâches du jour", page: "tasks", color: C.primary, bg: "#f0fdf4" },
          { icon: "👥", label: "Mon équipe", page: "team", color: "#7c3aed", bg: "#f5f3ff" },
          { icon: "💸", label: "Retrait", page: "withdraw", color: "#2563eb", bg: "#eff6ff" },
        ].map(s => (
          <div key={s.page} onClick={() => go(s.page)} style={{ background: s.bg, borderRadius: 14, padding: "16px", cursor: "pointer", border: `1.5px solid ${s.color}30` }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dernières transactions */}
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Dernières transactions</h3>
      <Card style={{ marginBottom: 20, padding: "0" }}>
        {last3.length === 0
          ? <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "24px 0" }}><div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>Aucune transaction.</div>
          : last3.map((tx: Transaction) => (
            <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.borderGray}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: typeColor[tx.type] + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{typeIcon[tx.type]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.description}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{fmtDate(tx.date)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: tx.type === "retrait" ? C.danger : C.primary }}>
                  {tx.type === "retrait" ? "-" : "+"}{tx.amount.toLocaleString()} XOF
                </div>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))
        }
        {last3.length > 0 && (
          <div onClick={() => go("transactions")} style={{ textAlign: "center", padding: "12px", fontSize: 13, color: C.primary, cursor: "pointer", fontWeight: 600 }}>Voir toutes les transactions →</div>
        )}
      </Card>

      <ReferralLink username={user.username} />
    </div>
  );
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
const TransactionsScreen = ({ user }: any) => {
  const [filter, setFilter] = useState("tous");
  const txs = [...(user.transactions || [])].reverse();
  const filtered = filter === "tous" ? txs : txs.filter((t: Transaction) => t.type === filter);
  const filters = [
    { key: "tous", label: "Tous" }, { key: "depot", label: "Dépôts" },
    { key: "retrait", label: "Retraits" }, { key: "tache", label: "Tâches" },
    { key: "roue", label: "Roue" },
  ];
  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 4px", fontWeight: 800 }}>📊 Transactions</h2>
      <p style={{ color: C.muted, fontSize: 13, margin: "0 0 16px" }}>Historique complet de votre compte</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" as const, paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "7px 14px", borderRadius: 20, background: filter === f.key ? C.primary : C.bgCard, border: `1.5px solid ${filter === f.key ? C.primary : C.borderGray}`, color: filter === f.key ? "#fff" : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>{f.label}</button>
        ))}
      </div>
      <Card style={{ padding: 0 }}>
        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}><div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>Aucune transaction.</div>
          : filtered.map((tx: Transaction) => (
            <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.borderGray}` }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: typeColor[tx.type] + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{typeIcon[tx.type]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.description}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{fmtDate(tx.date)}</div>
                {tx.method && <div style={{ fontSize: 11, color: C.muted }}>{tx.method}</div>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: tx.type === "retrait" ? C.danger : C.primary, marginBottom: 4 }}>
                  {tx.type === "retrait" ? "-" : "+"}{tx.amount.toLocaleString()} XOF
                </div>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
};

// ─── RETRAIT ─────────────────────────────────────────────────────────────────

// ─── RETRAIT ─────────────────────────────────────────────────────────────────
const WithdrawScreen = ({ user, onWithdraw }: any) => {
  const networks = COUNTRY_NETWORKS[user.country] || ["TMoney", "Flooz"];
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const amt = parseInt(amount) || 0;
  const fee = amt > 0 ? Math.round(amt * 0.05) : 0;
  const net = amt > 0 ? Math.max(0, amt - fee) : 0;
  const canWithdraw = method !== "" && amt >= 3000 && amt <= (user.balance || 0);

  const submitWithdraw = () => {
    if (!canWithdraw) return;
    onWithdraw(amt, method);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ padding: "32px 20px", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#f0fdf4", border: "3px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 20 }}>✅</div>
      <h2 style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 22 }}>Demande soumise !</h2>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, maxWidth: 300, margin: "0 0 8px" }}>
        Votre demande de retrait de <strong style={{ color: C.text }}>{amt.toLocaleString()} XOF</strong> via <strong style={{ color: C.text }}>{method}</strong> a bien été enregistrée.
      </p>
      <p style={{ color: C.muted, fontSize: 13, margin: "0 0 8px" }}>Vous recevrez <strong style={{ color: C.primary }}>{net.toLocaleString()} XOF</strong> sur le <strong>{user.phone}</strong>.</p>
      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px", marginBottom: 28, maxWidth: 320 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
          ⏳ Votre demande est <strong>en attente de validation</strong> par l'administrateur. Vous serez payé dès validation sous <strong>24h</strong>.
        </p>
      </div>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <Btn onClick={() => { setSubmitted(false); setAmount(""); setMethod(""); }} outline>Nouvelle demande</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "24px 20px 40px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 22, color: C.text }}>💸 Retrait de fonds</h2>
      <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>Votre demande sera traitée par l'admin sous 24h</p>

      {/* Info numéro */}
      <div style={{ background: "#e8f4fd", border: "1px solid #b3d9f5", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#1e3a5f", lineHeight: 1.7 }}>
          🔒 Le paiement sera envoyé au numéro <strong>{user.phone || "—"}</strong>. Contactez l'admin si incorrect.
        </p>
      </div>

      {/* Solde */}
      <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: C.muted }}>Solde disponible</span>
        <span style={{ fontWeight: 800, fontSize: 20, color: C.primary }}>{(user.balance || 0).toLocaleString()} XOF</span>
      </div>

      {/* Réseau */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Réseau de paiement</label>
        <div style={{ position: "relative" }}>
          <select value={method} onChange={(e: any) => setMethod(e.target.value)}
            style={{ width: "100%", appearance: "none" as const, background: "#fff", border: `1.5px solid ${C.borderGray}`, borderRadius: 10, padding: "13px 40px 13px 14px", color: method ? C.text : "#9ca3af", fontSize: 14, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
            <option value="" disabled>Choisissez un réseau</option>
            {networks.map((n: string) => <option key={n} value={n}>{n}</option>)}
          </select>
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: C.muted, fontSize: 12 }}>▼</div>
        </div>
      </div>

      {/* Montant */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Montant (XOF)</label>
        <input type="number" placeholder="Ex: 5 000" value={amount} onChange={(e: any) => setAmount(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" as const, background: "#fff", border: `1.5px solid ${C.borderGray}`, borderRadius: 10, padding: "13px 14px", color: C.text, fontSize: 15, fontWeight: 600, outline: "none", fontFamily: "inherit" }} />
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Minimum : <strong>3 000 XOF</strong></div>
      </div>

      {/* Récap frais */}
      {amt >= 3000 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
          Frais (5%) : <strong>{fee.toLocaleString()} XOF</strong>
          <span style={{ display: "block", marginTop: 4, color: C.primary, fontWeight: 700 }}>→ Vous recevrez : {net.toLocaleString()} XOF</span>
        </div>
      )}

      {/* Erreurs */}
      {amt > 0 && amt < 3000 && <div style={{ color: C.danger, fontSize: 12, marginBottom: 12, padding: "10px 14px", background: "#fef2f2", borderRadius: 10 }}>⚠️ Montant minimum : 3 000 XOF.</div>}
      {amt > (user.balance || 0) && <div style={{ color: C.danger, fontSize: 12, marginBottom: 12, padding: "10px 14px", background: "#fef2f2", borderRadius: 10 }}>⚠️ Solde insuffisant.</div>}

      <Btn onClick={submitWithdraw} disabled={!canWithdraw} color={C.blue}>
        📤 Soumettre la demande de retrait
      </Btn>
      <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10 }}>⏳ Traitement par l'admin sous 24h</p>
    </div>
  );
};

// ─── EQUIPE ──────────────────────────────────────────────────────────────────
const TeamScreen = ({ user, accounts }: any) => {
  const [tab, setTab] = useState("niveau1");

  // Calcul des filleuls par niveau
  const allAccounts = accounts || [];

  // Niveau 1 : parrainés directement par user
  const niv1 = allAccounts.filter((a: any) => a.sponsor === user.username && a.isActive);

  // Niveau 2 : parrainés par les membres niv1
  const niv1Usernames = niv1.map((a: any) => a.username);
  const niv2 = allAccounts.filter((a: any) => niv1Usernames.includes(a.sponsor) && a.isActive);

  // Niveau 3 : parrainés par les membres niv2
  const niv2Usernames = niv2.map((a: any) => a.username);
  const niv3 = allAccounts.filter((a: any) => niv2Usernames.includes(a.sponsor) && a.isActive);

  // Revenus passifs estimés
  const totalPassif = (niv1.length * 1500) + (niv2.length * 500) + (niv3.length * 200);

  const referrals = niv1.length;
  const bonusOk = referrals >= 25;

  const tabMembers: any = { niveau1: niv1, niveau2: niv2, niveau3: niv3, passifs: [] };
  const currentMembers = tabMembers[tab] || [];

  const MemberCard = ({ member }: any) => (
    <Card style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${C.primaryLight},${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
        {(member.username || "?")[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{member.username}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{member.country || "—"} • {member.phone || "—"}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: member.isActive ? C.primary : "#ef4444" }}>
          {member.isActive ? "✅ Actif" : "❌ Inactif"}
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{member.referrals || 0} filleul(s)</div>
      </div>
    </Card>
  );

  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 4px", fontWeight: 800 }}>👥 Mon Équipe</h2>
      <p style={{ color: C.muted, fontSize: 13, margin: "0 0 16px" }}>Gérez et suivez votre réseau</p>

      {/* Bonus bienvenue */}
      <Card style={{ marginBottom: 14, background: bonusOk ? `linear-gradient(135deg,${C.accent},#d97706)` : `linear-gradient(135deg,#fef3c7,#fde68a)`, border: "none", padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: bonusOk ? "#fffbeb" : "#92400e", marginBottom: 4 }}>🎁 Bonus de bienvenue</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: bonusOk ? "#fff" : "#78350f" }}>500 XOF</div>
            <div style={{ fontSize: 12, color: bonusOk ? "#fef3c7" : "#92400e", marginTop: 4 }}>{bonusOk ? "✅ Débloqué !" : `Parrainer 25 membres niveau 1 (${referrals}/25)`}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: bonusOk ? "#fef3c7" : "#92400e" }}>Progression</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: bonusOk ? "#fff" : "#78350f" }}>{referrals}/25</div>
          </div>
        </div>
        <div style={{ marginTop: 14, background: "rgba(0,0,0,0.15)", borderRadius: 99, height: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", background: bonusOk ? "#fff" : C.primary, borderRadius: 99, width: `${Math.min((referrals / 25) * 100, 100)}%` }} />
        </div>
      </Card>

      {/* Stats par niveau */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[["Niv. 1", "1 500 XOF", C.primary, niv1.length], ["Niv. 2", "500 XOF", C.blue, niv2.length], ["Niv. 3", "200 XOF", C.purple, niv3.length]].map(([l, v, c, count]) => (
          <Card key={l as string} style={{ textAlign: "center", padding: "12px 8px", borderTop: `4px solid ${c}` }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c as string }}>{count as number}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{v}</div>
          </Card>
        ))}
      </div>

      {/* Revenus passifs estimés */}
      <Card style={{ marginBottom: 14, background: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#16653a", fontWeight: 700 }}>💰 Revenus passifs estimés</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Total de votre réseau actif</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>{totalPassif.toLocaleString()} XOF</div>
        </div>
      </Card>

      <ReferralLink username={user.username} />
      <div style={{ height: 14 }} />

      {/* Onglets niveaux */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[{ key: "niveau1", label: `Niv. 1 (${niv1.length})` }, { key: "niveau2", label: `Niv. 2 (${niv2.length})` }, { key: "niveau3", label: `Niv. 3 (${niv3.length})` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "8px 4px", borderRadius: 20, background: tab === t.key ? C.primary : C.bgCard, border: `1.5px solid ${tab === t.key ? C.primary : C.borderGray}`, color: tab === t.key ? "#fff" : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{t.label}</button>
        ))}
      </div>

      {/* Liste membres */}
      {currentMembers.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Aucun membre à ce niveau</div>
            <div style={{ fontSize: 12, color: C.muted }}>Partagez votre lien pour recruter.</div>
          </div>
        </Card>
      ) : (
        currentMembers.map((m: any) => <MemberCard key={m.id} member={m} />)
      )}
    </div>
  );
};

// ─── TACHES ──────────────────────────────────────────────────────────────────
const SpinnerBtn = ({ onClick, disabled, done, reward }: any) => {
  const [spinning, setSpinning] = useState(false);
  const [rot, setRot] = useState(0);
  const handleClick = () => {
    if (disabled || done) return;
    setSpinning(true);
    setRot(r => r + 720);
    setTimeout(() => { setSpinning(false); onClick(); }, 1200);
  };
  return (
    <div onClick={handleClick} style={{
      width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
      background: done ? "#d1fae5" : disabled ? "#f3f4f6" : `linear-gradient(135deg,${C.primaryLight},${C.primaryDark})`,
      display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
      cursor: (disabled || done) ? "not-allowed" : "pointer",
      boxShadow: done ? "none" : disabled ? "none" : `0 4px 16px ${C.primary}44`,
      transition: "box-shadow 0.2s",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        transform: `rotate(${rot}deg)`,
        transition: spinning ? `transform 1.2s cubic-bezier(0.17,0.67,0.12,0.99)` : "none",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        width: "100%", height: "100%",
      }}>
        {done ? (
          <span style={{ fontSize: 26 }}>✅</span>
        ) : (
          <>
            <span style={{ fontSize: 18, lineHeight: 1 }}>⛏️</span>
            <span style={{ fontSize: 9, color: disabled ? C.muted : "#fff", fontWeight: 800, marginTop: 2 }}>MINE</span>
          </>
        )}
      </div>
      {spinning && !done && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `3px solid transparent`,
          borderTop: `3px solid #fff`,
          animation: "none",
        }} />
      )}
    </div>
  );
};

const TasksScreen = ({ user, onComplete, tasks, taskWindow, taskDoneToday, onTaskSpin, onTaskWheelMiss }: any) => {
  const today = new Date().toISOString().split("T")[0];
  const canDo = !!taskWindow?.available;
  const alreadyDone = !!taskDoneToday || user.taskLastDate === today || user.taskDoneToday;
  const taskList = tasks && tasks.length > 0 ? tasks : [{ id: "default", title: "Tâche du jour", description: "Activité quotidienne rémunérée automatiquement.", reward: 100, active: true }];
  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 4px", fontWeight: 800 }}>📋 Tâches quotidiennes</h2>
      <p style={{ color: C.muted, fontSize: 13, margin: "0 0 12px" }}>Disponibles de <strong>8h à 11h</strong> — une seule tâche par jour.</p>
      {taskWindow && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: taskWindow.available ? "#f0fdf4" : "#fffbeb", border: `1px solid ${taskWindow.available ? "#bbf7d0" : "#fde68a"}`, color: taskWindow.available ? "#166534" : "#92400e", fontSize: 12, fontWeight: 700 }}>
        {alreadyDone ? "✅ Tâche déjà faite. Revenez dans 2 jours entre 8h et 11h." : taskWindow.message}
      </div>}

      {taskList.map((task: any) => (
        <Card key={task.id} style={{ marginBottom: 12, borderLeft: `4px solid ${canDo && !alreadyDone ? C.primary : C.muted}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>🎯 {task.title}</div>
              {task.description && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{task.description}</div>}
            </div>
            <SpinnerBtn
              onClick={() => onComplete(task.reward)}
              disabled={!canDo || alreadyDone}
              done={alreadyDone}
              reward={task.reward}
            />
          </div>
        </Card>
      ))}
      <div style={{ marginTop: 20 }}>
        <TaskWheelScreen user={user} onSpin={onTaskSpin} onMiss={onTaskWheelMiss} />
      </div>
    </div>
  );
};

// ─── DEUXIÈME ROUE (TÂCHES) ──────────────────────────────────────────────────
const TASK_WHEEL_SEGMENTS = [
  { label: "50",   color: "#f97316", textColor: "#fff" },
  { label: "1000", color: C.primary, textColor: "#fff" },
  { label: "75",   color: "#8b5cf6", textColor: "#fff" },
  { label: "2000", color: C.accent,  textColor: "#fff" },
  { label: "80",   color: C.blue,    textColor: "#fff" },
  { label: "3000", color: "#10b981", textColor: "#fff" },
  { label: "100",  color: "#ef4444", textColor: "#fff" },
  { label: "5000", color: "#7c3aed", textColor: "#fff" },
  { label: "150",  color: "#0ea5e9", textColor: "#fff" },
];

const TaskWheelScreen = ({ user, onSpin, onMiss }: any) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);

  const now = new Date();
  const hour = now.getHours();
  const todayStr = now.toISOString().split("T")[0];

  // Disponible de 8h à 11h
  const isTimeOk = hour >= 8 && hour < 11;

  // Logique : la roue est disponible 8h-11h.
  // Si l'utilisateur tourne OU rate le créneau (11h passé sans tourner),
  // la roue est bloquée pour 2 jours à partir du 8h de ce jour.
  // On stocke la date du dernier "jour de disponibilité" (taskWheelLastUsed = date ISO du spin OU du jour raté)
  const taskWheelLastUsed = user.taskWheelLastUsed || "";
  let isBlocked = false;
  let hoursLeft = 0;

  // Calcul de la prochaine fenêtre disponible
  // La roue est bloquée 2 jours à partir du 8h du jour d'utilisation/manquement
  if (taskWheelLastUsed) {
    const lastDate = new Date(taskWheelLastUsed);
    // Début de la fenêtre du jour d'utilisation = 8h ce jour-là
    const lastDay8h = new Date(lastDate);
    lastDay8h.setHours(8, 0, 0, 0);
    // Déblocage = lastDay8h + 48h
    const unlockDate = new Date(lastDay8h.getTime() + 2 * 24 * 60 * 60 * 1000);
    if (now < unlockDate) {
      isBlocked = true;
      hoursLeft = Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    }
  }

  // Si on est après 11h aujourd'hui et que la roue n'a pas encore été marquée comme utilisée/manquée aujourd'hui
  // → on considère que l'utilisateur a raté le créneau, la roue sera bloquée 2 jours
  // (géré côté handleTaskSpin : on enregistre aussi quand le créneau est passé sans action)

  const canSpin = isTimeOk && !isBlocked && !spinning;

  // Si on est après 11h aujourd'hui et la roue n'a pas été marquée aujourd'hui → créneau raté → bloquer 2 jours
  useEffect(() => {
    if (hour >= 11 && !isBlocked) {
      const lastUsedDay = user.taskWheelLastUsed ? user.taskWheelLastUsed.split("T")[0] : "";
      if (lastUsedDay !== todayStr) {
        // Marquer comme raté aujourd'hui à 8h (pour déclencher le blocage 2 jours)
        const today8h = new Date();
        today8h.setHours(8, 0, 0, 0);
        onMiss(today8h.toISOString());
      }
    }
  }, []);

  const spin = () => {
    if (!canSpin) return;
    setSpinning(true); setWon(false);
    const r = rotation + 1440 + Math.random() * 360;
    setRotation(r);
    const realGain = Math.random() < 0.5 ? 80 : 100;
    setWonAmount(realGain);
    setTimeout(() => { setSpinning(false); setWon(true); onSpin(realGain); }, 2600);
  };

  const segCount = TASK_WHEEL_SEGMENTS.length;
  const segAngle = 360 / segCount;

  return (
    <div style={{ padding: "20px 20px 32px", background: "#fff8f0", borderRadius: 18, border: "2px solid #fed7aa", marginBottom: 20 }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#c2410c" }}>🎡 Roue des Tâches</div>
        <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>Disponible de <strong>8h à 11h</strong> • Bloquée <strong>48h</strong> après utilisation</div>
      </div>

      {/* Bloquée (tourné ou créneau raté) */}
      {isBlocked && !won && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>🔒</div>
          <div style={{ fontWeight: 800, color: "#dc2626", fontSize: 14 }}>Roue bloquée — 48h</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            Disponible dans <strong>{hoursLeft}h</strong> entre 8h et 11h
          </div>
        </div>
      )}

      {/* Hors horaire ET pas bloquée → créneau raté aujourd'hui → sera bloquée 2 jours */}
      {!isBlocked && !isTimeOk && !won && (
        <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>⏰</div>
          <div style={{ fontWeight: 800, color: "#92400e", fontSize: 14 }}>Hors horaire</div>
          <div style={{ fontSize: 12, color: "#78350f", marginTop: 4 }}>
            {hour < 8
              ? `Revenez à 8h (dans ${8 - hour}h) — ne ratez pas le créneau !`
              : "Créneau raté. Revenez dans 2 jours à 8h."}
          </div>
        </div>
      )}

      {won && !spinning && (
        <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: 12, padding: "14px", marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>🎉</div>
          <div style={{ fontWeight: 800, color: C.primary, fontSize: 16 }}>Félicitations !</div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>+<strong style={{ color: C.primary }}>{wonAmount} XOF</strong> ajoutés à votre solde.</div>
        </div>
      )}

      {/* Roue SVG */}
      <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto 16px" }}>
        <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 26, zIndex: 10, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>▼</div>
        <svg width="220" height="220" viewBox="0 0 220 220"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 2.6s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
            filter: (!canSpin && !spinning && !won) ? "grayscale(0.6) opacity(0.5)" : "drop-shadow(0 6px 18px rgba(0,0,0,0.2))",
            borderRadius: "50%",
          }}>
          {TASK_WHEEL_SEGMENTS.map((seg, i) => {
            const startAngle = i * segAngle - 90;
            const endAngle = (i + 1) * segAngle - 90;
            const s = Math.PI / 180;
            const r = 110;
            const cx = 110; const cy = 110;
            const x1 = cx + r * Math.cos(startAngle * s);
            const y1 = cy + r * Math.sin(startAngle * s);
            const x2 = cx + r * Math.cos(endAngle * s);
            const y2 = cy + r * Math.sin(endAngle * s);
            const midAngle = (startAngle + endAngle) / 2;
            const tr = 72;
            const tx = cx + tr * Math.cos(midAngle * s);
            const ty = cy + tr * Math.sin(midAngle * s);
            return (
              <g key={i}>
                <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="#fff" strokeWidth="2" />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill={seg.textColor}
                  fontSize="11" fontWeight="800" transform={`rotate(${midAngle + 90},${tx},${ty})`}
                  style={{ fontFamily: "inherit" }}>
                  {seg.label}
                </text>
              </g>
            );
          })}
          <circle cx="110" cy="110" r="26" fill="#fff" stroke="#e5e7eb" strokeWidth="3" />
          <text x="110" y="110" textAnchor="middle" dominantBaseline="middle" fontSize="18">
            {isBlocked ? "🔒" : "🎡"}
          </text>
        </svg>
      </div>

      {canSpin && (
        <div style={{ textAlign: "center" }}>
          <button onClick={spin} disabled={spinning}
            style={{ padding: "12px 32px", background: spinning ? "#94a3b8" : "#f97316", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 800, cursor: spinning ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px #f9731644" }}>
            {spinning ? "En cours…" : "TOURNER !"}
          </button>
        </div>
      )}

      <div style={{ marginTop: 14, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px" }}>
        <div style={{ fontSize: 11, color: "#c2410c", fontWeight: 700, marginBottom: 4 }}>ℹ️ Règles</div>
        <div style={{ fontSize: 11, color: "#92400e", lineHeight: 1.8 }}>
          • Disponible de <strong>8h à 11h</strong> chaque 2 jours<br />
          • Bloquée <strong>48h</strong> après utilisation<br />
          • Gain réel limité à <strong>80 ou 100 XOF</strong>, même si la roue affiche plus<br />
        </div>
      </div>
    </div>
  );
};

// ─── ROUE ────────────────────────────────────────────────────────────────────
const WHEEL_SEGMENTS = [
  { label: "1000", color: C.primary, textColor: "#fff" },
  { label: "5000", color: C.accent, textColor: "#fff" },
  { label: "2000", color: C.blue, textColor: "#fff" },
  { label: "3000", color: C.purple, textColor: "#fff" },
  { label: "1000", color: "#ef4444", textColor: "#fff" },
  { label: "5000", color: "#10b981", textColor: "#fff" },
  { label: "2000", color: "#f97316", textColor: "#fff" },
  { label: "3000", color: "#8b5cf6", textColor: "#fff" },
];

const WheelScreen = ({ user, onSpin }: any) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState(false);

  // Bloquée définitivement après la première utilisation
  const alreadyUsed = !!user.wheelUsed;
  const canSpin = !alreadyUsed && !spinning;
  const FIXED_GAIN = 100;

  const spin = () => {
    if (!canSpin) return;
    setSpinning(true); setWon(false);
    const r = rotation + 1440 + Math.random() * 360;
    setRotation(r);
    setTimeout(() => { setSpinning(false); setWon(true); onSpin(FIXED_GAIN); }, 2600);
  };

  const segCount = WHEEL_SEGMENTS.length;
  const segAngle = 360 / segCount;

  return (
    <div style={{ padding: "24px 20px 40px", background: C.bg, minHeight: "100vh", textAlign: "center" }}>
      <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22 }}>🎰 Roue de fortune</h2>
      <p style={{ color: C.muted, fontSize: 13, margin: "0 0 8px" }}>Une chance unique par compte • <strong>+100 XOF garanti</strong></p>

      {/* Bloquée définitivement */}
      {alreadyUsed && !won && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 14, padding: "20px", marginBottom: 20, maxWidth: 300, margin: "0 auto 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 800, color: "#dc2626", fontSize: 16, marginBottom: 6 }}>Roue bloquée définitivement</div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
            Vous avez déjà utilisé votre chance unique.<br />
            Cette roue ne peut être tournée <strong>qu'une seule fois</strong> par compte.
          </div>
        </div>
      )}

      {/* Bannière victoire */}
      {won && !spinning && (
        <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 800, color: C.primary, fontSize: 18, marginBottom: 4 }}>Félicitations !</div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>+<strong style={{ color: C.primary }}>{FIXED_GAIN} XOF</strong> ajoutés à votre solde.<br /><span style={{ color: "#dc2626", fontWeight: 700 }}>Cette roue est maintenant bloquée définitivement.</span></div>
        </div>
      )}

      {/* Roue SVG */}
      <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto 28px" }}>
        <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: 28, zIndex: 10, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>▼</div>
        <svg
          width="240" height="240" viewBox="0 0 240 240"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 2.6s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
            filter: (alreadyUsed && !spinning && !won) ? "grayscale(0.8) opacity(0.4)" : "drop-shadow(0 8px 24px rgba(0,0,0,0.25))",
            borderRadius: "50%",
          }}
        >
          {WHEEL_SEGMENTS.map((seg, i) => {
            const startAngle = i * segAngle - 90;
            const endAngle = (i + 1) * segAngle - 90;
            const s = Math.PI / 180;
            const r = 120;
            const x1 = 120 + r * Math.cos(startAngle * s);
            const y1 = 120 + r * Math.sin(startAngle * s);
            const x2 = 120 + r * Math.cos(endAngle * s);
            const y2 = 120 + r * Math.sin(endAngle * s);
            return (
              <g key={i}>
                <path d={`M120,120 L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="#fff" strokeWidth="2" />
              </g>
            );
          })}
          <circle cx="120" cy="120" r="30" fill="#fff" stroke="#e5e7eb" strokeWidth="3" />
          <text x="120" y="120" textAnchor="middle" dominantBaseline="middle" fontSize="22">
            {alreadyUsed ? "🔒" : "🎰"}
          </text>
        </svg>
      </div>

      {canSpin && (
        <Btn onClick={spin} disabled={spinning} color={C.accent} style={{ maxWidth: 220, margin: "0 auto", fontSize: 16, fontWeight: 800 }}>
          {spinning ? "En cours…" : "TOURNER !"}
        </Btn>
      )}

      {!alreadyUsed && !won && (
        <div style={{ marginTop: 16, fontSize: 13, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", maxWidth: 280, margin: "16px auto 0" }}>
          ⚠️ Attention : une fois tournée, la roue est bloquée définitivement
        </div>
      )}

      <div style={{ marginTop: 16, background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", maxWidth: 300, margin: "16px auto 0" }}>
        <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, marginBottom: 4 }}>ℹ️ Règles de la roue</div>
        <div style={{ fontSize: 11, color: "#16653a", lineHeight: 1.8, textAlign: "left" }}>
          • <strong>Une seule utilisation</strong> par compte, à vie<br />
          • Gain garanti : <strong>+100 XOF</strong> crédités immédiatement<br />
          • Disponible dès l'inscription<br />
          • Bloquée définitivement après utilisation
        </div>
      </div>
    </div>
  );
};

// ─── COMMUNAUTE ──────────────────────────────────────────────────────────────
const CommunityScreen = () => (
  <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
    <h2 style={{ margin: "0 0 4px", fontWeight: 800 }}>💬 Communauté</h2>
    <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>Rejoignez nos canaux officiels</p>
    {[
      { icon: "💬", label: "Chaîne WhatsApp", sub: "Actualités et support", color: "#22c55e", href: "https://whatsapp.com/channel/0029Vb8WY920gcfGro6pC31p" },
      { icon: "✈️", label: "Chaîne Telegram", sub: "Communauté et annonces", color: "#2563eb", href: "https://t.me/gpt881" },
    ].map(c => (
      <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 12 }}>
        <Card style={{ border: `1.5px solid ${c.color}33`, background: "#ffffff", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{c.icon}</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{c.label}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.sub}</div></div>
            <span style={{ color: c.color, fontSize: 20 }}>›</span>
          </div>
        </Card>
      </a>
    ))}
  </div>
);

// ─── PROFIL ──────────────────────────────────────────────────────────────────
const ProfileScreen = ({ user }: any) => {
  const infos = [
    { label: "Email", value: user.email || "—", icon: "📧" },
    { label: "Téléphone", value: user.phone || "—", icon: "📱" },
    { label: "Pays", value: user.country || "—", icon: "🌍" },
    { label: "Parrain", value: user.sponsor || "—", icon: "🤝" },
    { label: "Date d'activation", value: user.activatedAt || "—", icon: "📅" },
    { label: "Membres sur ma ligne", value: `${user.referrals || 0}`, icon: "👥" },
  ];
  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 20px", fontWeight: 800 }}>👤 Mon Profil</h2>
      <Card>
        <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: `linear-gradient(135deg,${C.primaryLight},${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#fff", margin: "0 auto 12px", boxShadow: `0 4px 16px ${C.primary}44` }}>{(user.username?.[0] ?? "?").toUpperCase()}</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{user.username}</div>
          <Badge color={C.primary}>Compte actif ✓</Badge>
        </div>
        {infos.map(item => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1px solid ${C.borderGray}` }}>
            <span style={{ fontSize: 13, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}><span>{item.icon}</span>{item.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── CONTACT ─────────────────────────────────────────────────────────────────
const ContactScreen = () => (
  <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
    <h2 style={{ margin: "0 0 4px", fontWeight: 800 }}>📞 Nous contacter</h2>
    <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>Notre équipe répond rapidement</p>
    {[
      { icon: "📧", label: "Email", value: " jackcasimir44@gmail.com.com", href: "mailto: jackcasimir44@gmail.com" },
      { icon: "💬", label: "WhatsApp", value: "+228  72 31 73 98", href: "https://wa.me/22872317398" },
    ].map(c => (
      <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block", marginBottom: 12 }}>
        <Card style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{c.icon}</div>
            <div><div style={{ fontWeight: 700 }}>{c.label}</div><div style={{ fontSize: 13, color: C.primary, marginTop: 2 }}>{c.value}</div></div>
          </div>
        </Card>
      </a>
    ))}
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// ─── ADMIN ──────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
const MOCK_USERS = [
  { id: "u1", username: "kofi_adu", email: "kofi@mail.com", phone: "+228 90112233", country: "Togo", sponsor: "admin", isActive: true, activatedAt: "2025-01-10", balance: 4500, referrals: 8, taskDoneToday: false, wheelUsed: true },
  { id: "u2", username: "amina_fall", email: "amina@mail.com", phone: "+221 77223344", country: "Sénégal", sponsor: "kofi_adu", isActive: true, activatedAt: "2025-01-15", balance: 2100, referrals: 3, taskDoneToday: true, wheelUsed: true },
  { id: "u3", username: "moussa_bah", email: "moussa@mail.com", phone: "+226 70334455", country: "Burkina Faso", sponsor: "kofi_adu", isActive: false, activatedAt: "", balance: 0, referrals: 0, taskDoneToday: false, wheelUsed: false },
  { id: "u4", username: "fatou_diallo", email: "fatou@mail.com", phone: "+225 07445566", country: "Côte d'Ivoire", sponsor: "amina_fall", isActive: true, activatedAt: "2025-01-20", balance: 800, referrals: 1, taskDoneToday: false, wheelUsed: false },
];
const MOCK_DEPOSITS = [
  { id: "d1", userId: "u1", username: "kofi_adu", amount: 3500, method: "TMoney", date: "2025-01-10", status: "validé" },
  { id: "d2", userId: "u2", username: "amina_fall", amount: 3500, method: "Wave", date: "2025-01-15", status: "validé" },
  { id: "d3", userId: "u3", username: "moussa_bah", amount: 3500, method: "Orange Money", date: "2025-01-22", status: "en attente" },
  { id: "d4", userId: "u4", username: "fatou_diallo", amount: 3500, method: "MTN Money", date: "2025-01-20", status: "validé" },
];
const MOCK_WITHDRAWALS = [
  { id: "w1", userId: "u1", username: "kofi_adu", amount: 5000, method: "TMoney", date: "2025-01-18", status: "payé" },
  { id: "w2", userId: "u2", username: "amina_fall", amount: 3000, method: "Wave", date: "2025-01-21", status: "en attente" },
  { id: "w3", userId: "u4", username: "fatou_diallo", amount: 4000, method: "Orange Money", date: "2025-01-23", status: "en attente" },
];

const AdminDashboard = ({ users, deposits, withdrawals, tasks }: any) => {
  const active = users.filter((u: any) => u.isActive).length;
  const pendingDep = deposits.filter((d: any) => d.status === "en attente").length;
  const pendingWith = withdrawals.filter((w: any) => w.status === "en attente").length;
  const totalRev = deposits.filter((d: any) => d.status === "validé").reduce((s: number, d: any) => s + d.amount, 0);
  const stats = [
    { label: "Utilisateurs total", value: users.length, icon: "👥", color: C.primary },
    { label: "Comptes actifs", value: active, icon: "✅", color: C.primaryDark },
    { label: "Dépôts en attente", value: pendingDep, icon: "💳", color: C.accent },
    { label: "Retraits en attente", value: pendingWith, icon: "💸", color: C.blue },
    { label: "Revenus totaux (XOF)", value: totalRev.toLocaleString(), icon: "💰", color: C.purple },
    { label: "Tâches actives", value: tasks.length, icon: "📋", color: "#10b981" },
  ];
  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 4px", fontWeight: 800 }}>⚙️ Administration</h2>
      <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>Vue d'ensemble de la plateforme</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {stats.map(s => (
          <Card key={s.label} style={{ padding: "14px 16px", borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
          </Card>
        ))}
      </div>
      <Card style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, border: "none" }}>
        <div style={{ color: "#86efac", fontSize: 12, marginBottom: 4 }}>Revenus plateforme (activations)</div>
        <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>{totalRev.toLocaleString()} XOF</div>
        <div style={{ color: "#86efac", fontSize: 12, marginTop: 4 }}>{active} comptes actifs × 3 500 XOF</div>
      </Card>
    </div>
  );
};

const AdminUsers = ({ users, onToggleActive }: any) => {
  const [search, setSearch] = useState("");
  const filtered = users.filter((u: any) => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 16px", fontWeight: 800 }}>👥 Utilisateurs</h2>
      <Input placeholder="Rechercher..." value={search} onChange={setSearch} icon="🔍" />
      {filtered.map((u: any) => (
        <Card key={u.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.primary + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: C.primary, fontSize: 13, flexShrink: 0 }}>{u.username[0].toUpperCase()}</div>
                <div><div style={{ fontWeight: 700, fontSize: 14 }}>{u.username}</div><div style={{ fontSize: 11, color: C.muted }}>{u.email}</div></div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 11, color: C.muted }}>📱 {u.phone}</span>
                <span style={{ fontSize: 11, color: C.muted }}>🌍 {u.country}</span>
                <span style={{ fontSize: 11, color: C.muted }}>👥 {u.referrals} filleuls</span>
                <span style={{ fontSize: 11, color: C.primary, fontWeight: 600 }}>💰 {u.balance.toLocaleString()} XOF</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", marginLeft: 10 }}>
              <StatusBadge status={u.isActive ? "validé" : "en attente"} />
              <Btn small onClick={() => onToggleActive(u.id)} color={u.isActive ? C.danger : C.primary} style={{ width: "auto", padding: "5px 12px" }}>{u.isActive ? "Désactiver" : "Activer"}</Btn>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const AdminDeposits = ({ deposits, onValidate }: any) => {
  const [filter, setFilter] = useState("tous");
  const filtered = filter === "tous" ? deposits : deposits.filter((d: any) => d.status === filter);
  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 16px", fontWeight: 800 }}>💳 Dépôts & Activations</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["tous", "en attente", "validé"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 20, background: filter === f ? C.primary : C.bgCard, border: `1.5px solid ${filter === f ? C.primary : C.borderGray}`, color: filter === f ? "#fff" : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{f}</button>
        ))}
      </div>
      {filtered.map((d: any) => (
        <Card key={d.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div><div style={{ fontWeight: 700, marginBottom: 4 }}>👤 {d.username}</div><div style={{ fontSize: 12, color: C.muted }}>📅 {d.date} · 📱 {d.method}</div><div style={{ fontSize: 13, fontWeight: 700, color: C.primary, marginTop: 4 }}>{d.amount.toLocaleString()} XOF</div></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <StatusBadge status={d.status} />
              {d.status === "en attente" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small onClick={() => onValidate(d.id, "validé")} color={C.primary} style={{ width: "auto", padding: "5px 12px" }}>✓ Valider</Btn>
                  <Btn small onClick={() => onValidate(d.id, "rejeté")} color={C.danger} style={{ width: "auto", padding: "5px 12px" }}>✗ Rejeter</Btn>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
      {filtered.length === 0 && <Card><div style={{ textAlign: "center", padding: "24px 0", color: C.muted }}><div style={{ fontSize: 28 }}>📭</div>Aucun dépôt.</div></Card>}
    </div>
  );
};

const AdminWithdrawals = ({ withdrawals, onValidate }: any) => {
  const [filter, setFilter] = useState("tous");
  const filtered = filter === "tous" ? withdrawals : withdrawals.filter((w: any) => w.status === filter);
  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 16px", fontWeight: 800 }}>💸 Retraits</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["tous", "en attente", "payé"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 20, background: filter === f ? C.primary : C.bgCard, border: `1.5px solid ${filter === f ? C.primary : C.borderGray}`, color: filter === f ? "#fff" : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{f}</button>
        ))}
      </div>
      {filtered.map((w: any) => (
        <Card key={w.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div><div style={{ fontWeight: 700, marginBottom: 4 }}>👤 {w.username}</div><div style={{ fontSize: 12, color: C.muted }}>📅 {w.date} · 📱 {w.method}</div><div style={{ fontSize: 13, fontWeight: 700, color: C.blue, marginTop: 4 }}>{w.amount.toLocaleString()} XOF</div><div style={{ fontSize: 11, color: C.muted }}>Net : {(w.amount - 500).toLocaleString()} XOF (frais -500)</div></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <StatusBadge status={w.status} />
              {w.status === "en attente" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small onClick={() => onValidate(w.id, "payé")} color={C.primary} style={{ width: "auto", padding: "5px 12px" }}>✓ Payer</Btn>
                  <Btn small onClick={() => onValidate(w.id, "rejeté")} color={C.danger} style={{ width: "auto", padding: "5px 12px" }}>✗ Rejeter</Btn>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
      {filtered.length === 0 && <Card><div style={{ textAlign: "center", padding: "24px 0", color: C.muted }}><div style={{ fontSize: 28 }}>📭</div>Aucun retrait.</div></Card>}
    </div>
  );
};

const AdminTasks = ({ tasks, onAdd, onDelete }: any) => {
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [reward, setReward] = useState("100"); const [showForm, setShowForm] = useState(false);
  const add = () => {
    if (!title) return;
    onAdd({ id: Date.now().toString(), title, description: desc, reward: parseInt(reward) || 100, active: true, createdAt: new Date().toISOString().split("T")[0] });
    setTitle(""); setDesc(""); setReward("100"); setShowForm(false);
  };
  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontWeight: 800 }}>📋 Tâches</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ background: C.primary, border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{showForm ? "✕ Annuler" : "+ Ajouter"}</button>
      </div>
      {showForm && (
        <Card style={{ marginBottom: 16, border: `2px solid ${C.primary}44` }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: C.primary }}>Nouvelle tâche</h3>
          <Input label="Titre *" placeholder="Ex: Regarder une vidéo" value={title} onChange={setTitle} />
          <Input label="Description" placeholder="Instructions..." value={desc} onChange={setDesc} />
          <Input label="Récompense (XOF)" type="number" placeholder="100" value={reward} onChange={setReward} icon="💰" />
          <Btn onClick={add} disabled={!title}>Créer la tâche</Btn>
        </Card>
      )}
      {tasks.length === 0 && <Card><div style={{ textAlign: "center", padding: "24px 0", color: C.muted }}><div style={{ fontSize: 28 }}>📝</div>Aucune tâche.</div></Card>}
      {tasks.map((t: any) => (
        <Card key={t.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>🎯 {t.title}</div>
              {t.description && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{t.description}</div>}
              <div style={{ display: "flex", gap: 8 }}><Badge color={C.primary}>+{t.reward} XOF</Badge><span style={{ fontSize: 11, color: C.muted }}>📅 {t.createdAt}</span></div>
            </div>
            <Btn small onClick={() => onDelete(t.id)} color={C.danger} style={{ width: "auto", padding: "6px 12px", marginLeft: 10 }}>🗑️</Btn>
          </div>
        </Card>
      ))}
    </div>
  );
};

const AdminParrainage = ({ users }: any) => {
  const totalRef = users.reduce((s: number, u: any) => s + (u.referrals || 0), 0);
  const top = [...users].sort((a, b) => b.referrals - a.referrals).slice(0, 5);
  return (
    <div style={{ padding: "20px", background: C.bg, minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 20px", fontWeight: 800 }}>🤝 Parrainage</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[["Niv. 1", "1 500 XOF", C.primary], ["Niv. 2", "500 XOF", C.blue], ["Niv. 3", "200 XOF", C.purple]].map(([l, v, c]) => (
          <Card key={l as string} style={{ textAlign: "center", padding: "14px 8px", borderTop: `4px solid ${c}` }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: c as string }}>{v}</div>
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom: 16 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Total parrainages</div><div style={{ fontSize: 28, fontWeight: 800, color: C.primary }}>{totalRef}</div></Card>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>🏆 Top parrains</h3>
      {top.map((u: any, i: number) => (
        <Card key={u.id} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? C.accent : C.bgCard2, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: i === 0 ? "#fff" : C.muted }}>{i + 1}</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{u.username}</div><div style={{ fontSize: 11, color: C.muted }}>{u.country}</div></div>
          <Badge color={C.primary}>{u.referrals} filleuls</Badge>
        </Card>
      ))}
    </div>
  );
};

// ─── DÉPÔT DE FONDS ──────────────────────────────────────────────────────────
const DepositScreen = ({ user, onDeposit }: any) => {
  const networks = COUNTRY_NETWORKS[user.country] || ["TMoney", "Flooz"];
  const [chain, setChain] = useState(networks[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const DEPOSIT_AMOUNT = 3500;

  const countryCode: Record<string, string> = {
    "Togo": "TG", "Bénin": "BJ", "Sénégal": "SN", "Côte d'Ivoire": "CI",
    "Cameroun": "CM", "Burkina Faso": "BF", "Mali": "ML", "Congo-Brazzaville": "CG",
  };

  const launchFedaPay = () => {
    if (!FEDAPAY_PUBLIC_KEY) { setError('Configuration paiement absente. Contactez l’administrateur.'); return; }
    setLoading(true); setError("");
    const initFeda = () => {
      try {
        (window as any).FedaPay.init({
          public_key: FEDAPAY_PUBLIC_KEY,
          transaction: {
            amount: DEPOSIT_AMOUNT,
            description: `Dépôt compte GoldenFortune — ${user.username}`,
          },
          customer: {
            email: user.email || "client@goldenfortune.com",
            phone_number: { number: user.phone || "", country: countryCode[user.country] || "TG" },
          },
          onComplete: (resp: any) => {
            setLoading(false);
            if (resp.reason === (window as any).FedaPay.DIALOG_DISMISSED) {
              setError("Paiement annulé. Réessayez.");
            } else {
              const txId = "DEP-" + Date.now().toString(36).toUpperCase();
              onDeposit(DEPOSIT_AMOUNT, chain, txId);
            }
          },
        }).open();
      } catch (e) {
        setLoading(false);
        setError("Erreur lors du chargement du paiement. Réessayez.");
      }
    };
    if ((window as any).FedaPay) {
      initFeda();
    } else {
      const existing = document.querySelector('script[src*="fedapay"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://cdn.fedapay.com/checkout.js?v=1.1.7";
        script.onload = () => initFeda();
        script.onerror = () => { setLoading(false); setError("Impossible de charger FedaPay. Vérifiez votre connexion."); };
        document.head.appendChild(script);
      } else {
        existing.addEventListener("load", initFeda);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ padding: "20px 16px" }}>
        <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 20 }}>Compte de recharge</h2>
        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px", lineHeight: 1.5 }}>Approvisionnez votre portefeuille via les canaux de paiement pris en charge.</p>

        {/* Bannière numéro */}
        {showBanner && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#e8f4fd", border: "1px solid #b3d4f0", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#2563a8", marginBottom: 2 }}>Utilisez ce numéro pour les dépôts :</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{user.phone || "+228 XX XX XX XX"}</div>
            </div>
            <button onClick={() => setShowBanner(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 20, lineHeight: 1 }}>✕</button>
          </div>
        )}

        {/* Card STK */}
        <Card style={{ padding: "20px 16px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}>Argent mobile (STK)</h3>
          <p style={{ color: C.muted, fontSize: 13, margin: "0 0 20px" }}>Initiez le paiement directement sur votre téléphone</p>

          {/* Sélectionner la chaîne */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Sélectionner la chaîne</label>
            <div style={{ position: "relative" }}>
              <select value={chain} onChange={(e: any) => setChain(e.target.value)}
                style={{ width: "100%", appearance: "none" as const, background: "#fff", border: `1.5px solid ${C.borderGray}`, borderRadius: 10, padding: "12px 38px 12px 14px", color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                {networks.map((n: string) => <option key={n} value={n}>{n}</option>)}
              </select>
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: C.muted, fontSize: 12 }}>▼</div>
            </div>
          </div>

          {/* Numéro de portefeuille */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Numéro de portefeuille</label>
            <input value={user.phone || ""} readOnly
              style={{ width: "100%", boxSizing: "border-box" as const, background: "#f9fafb", border: `1.5px solid ${C.borderGray}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 15, fontWeight: 600, outline: "none", fontFamily: "inherit" }} />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>🔒 Numéro utilisé lors de votre inscription</div>
          </div>

          {/* Montant fixe */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Montant</label>
            <div style={{ display: "flex", border: `1.5px solid ${C.borderGray}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#f3f4f6", padding: "12px 14px", fontSize: 14, fontWeight: 700, color: C.muted, borderRight: `1.5px solid ${C.borderGray}`, minWidth: 56, textAlign: "center" }}>XOF</div>
              <input type="number" readOnly value={DEPOSIT_AMOUNT}
                style={{ flex: 1, border: "none", padding: "12px 14px", fontSize: 15, fontWeight: 700, color: C.text, background: "#f9fafb", outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Minimum : <strong>3 500 XOF</strong></div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ background: "#fef9ec", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Bouton payer */}
          <Btn onClick={launchFedaPay} disabled={loading} color={C.primary}>
            {loading ? "Chargement..." : `🇹🇬 Payer ${DEPOSIT_AMOUNT.toLocaleString()} XOF avec ${chain}`}
          </Btn>

          <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 10 }}>
            🔒 Paiement sécurisé par FedaPay
          </p>
        </Card>
      </div>
    </div>
  );
};

// ─── SIDEBARS ────────────────────────────────────────────────────────────────
const AdminSidebar = ({ page, go, logout, stats }: any) => {
  const items = [
    { icon: "📊", label: "Tableau de bord", target: "admin-dashboard" },
    { icon: "👥", label: "Utilisateurs", target: "admin-users", badge: stats.users },
    { icon: "💳", label: "Dépôts", target: "admin-deposits", badge: stats.pendingDep > 0 ? stats.pendingDep : null, badgeColor: C.accent },
    { icon: "💸", label: "Retraits", target: "admin-withdrawals", badge: stats.pendingWith > 0 ? stats.pendingWith : null, badgeColor: C.blue },
    { icon: "📋", label: "Tâches", target: "admin-tasks" },
    { icon: "🤝", label: "Parrainage", target: "admin-parrainage" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
      <div style={{ width: 280, background: "#fff", borderRight: `1px solid ${C.borderGray}`, display: "flex", flexDirection: "column", overflowY: "auto" as const }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.borderGray}` }}><Logo /><div style={{ marginTop: 10 }}><Badge color={C.danger}>Administrateur</Badge></div></div>
        <div style={{ padding: "8px 0", flex: 1 }}>
          {items.map(item => (
            <div key={item.target} onClick={() => go(item.target)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", background: page === item.target ? C.primary + "12" : "transparent", borderLeft: page === item.target ? `3px solid ${C.primary}` : "3px solid transparent", color: page === item.target ? C.primary : C.text }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span><span style={{ fontSize: 13, flex: 1 }}>{item.label}</span>
              {item.badge != null && <Badge color={item.badgeColor || C.primary}>{item.badge}</Badge>}
            </div>
          ))}
          <div onClick={logout} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", color: C.danger, borderLeft: "3px solid transparent", borderTop: `1px solid ${C.borderGray}`, marginTop: 8 }}>
            <span style={{ fontSize: 18 }}>🚪</span><span style={{ fontSize: 13, fontWeight: 700 }}>Déconnexion</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, background: "#00000055" }} onClick={() => go(page)} />
    </div>
  );
};

const UserSidebar = ({ page, go, logout, user }: any) => {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (k: string) => setOpen(p => p === k ? null : k);
  const Item = ({ icon = "", label, target, indent = false, badge = "" }: any) => (
    <div onClick={() => go(target)} style={{ display: "flex", alignItems: "center", gap: 12, padding: indent ? "9px 20px 9px 44px" : "12px 20px", cursor: "pointer", background: page === target && !indent ? C.primary + "12" : "transparent", borderLeft: page === target ? `3px solid ${C.primary}` : "3px solid transparent", color: page === target ? C.primary : indent ? C.muted : C.text }}>
      {!indent && <span style={{ fontSize: 18 }}>{icon}</span>}
      {indent && <span style={{ fontSize: 9, color: C.primary }}>●</span>}
      <span style={{ fontSize: 13, flex: 1 }}>{label}</span>
      {badge && <Badge color={C.accent}>{badge}</Badge>}
    </div>
  );
  const Section = ({ id, icon, label, children }: any) => (
    <>
      <div onClick={() => toggle(id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", color: C.text }}>
        <span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 13, flex: 1 }}>{label}</span>
        <span style={{ fontSize: 12, color: C.muted, transform: open === id ? "rotate(90deg)" : "none", transition: "0.2s" }}>›</span>
      </div>
      {open === id && <div style={{ background: C.bgCard2 }}>{children}</div>}
    </>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
      <div style={{ width: 280, background: "#fff", borderRight: `1px solid ${C.borderGray}`, display: "flex", flexDirection: "column", overflowY: "auto" as const }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.borderGray}` }}>
          <Logo />
          <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.primary + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: C.primary }}>{(user.username?.[0] ?? "?").toUpperCase()}</div>
            <div><div style={{ fontSize: 14, fontWeight: 700 }}>{user.username}</div><div style={{ fontSize: 11, color: C.muted }}>{user.email}</div></div>
          </div>
        </div>
        <div style={{ padding: "8px 0", flex: 1 }}>
          <Item icon="🏠" label="Tableau de bord" target="dashboard" />
          <Section id="compte" icon="👤" label="Compte">
            <Item label="Dépôt de fonds" target="deposit" indent />
            <Item label="Toutes les transactions" target="transactions" indent />
          </Section>
          <Section id="community" icon="💬" label="Communauté">
            <Item label="WhatsApp" target="community" indent />
            <Item label="Telegram" target="community" indent />
          </Section>
          <Section id="retrait" icon="💸" label="Retraits">
            <Item label="Retrait solde total" target="withdraw" indent />
            <Item label="Historique de retrait" target="withdraw" indent />
          </Section>
          <Section id="equipe" icon="👥" label="Équipes">
            <Item label="Niveau 1 — 1 500 XOF" target="team" indent />
            <Item label="Niveau 2 — 500 XOF" target="team" indent />
            <Item label="Niveau 3 — 200 XOF" target="team" indent />
            <Item label="Passifs" target="team" indent />
          </Section>
          <Item icon="🎁" label="Bonus de bienvenue" target="team" badge="500 XOF" />
          <Item icon="🎰" label="Roue de fortune" target="wheel" badge="100 XOF" />
          <Item icon="📋" label="Tâches" target="tasks" />
          <Item icon="👤" label="Profil utilisateur" target="profile" />
          <Item icon="📞" label="Nous contacter" target="contact" />
          <div onClick={logout} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", color: C.danger, borderLeft: "3px solid transparent", borderTop: `1px solid ${C.borderGray}`, marginTop: 8 }}>
            <span style={{ fontSize: 18 }}>🚪</span><span style={{ fontSize: 13, fontWeight: 700 }}>Déconnexion</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, background: "#00000055" }} onClick={() => go(page)} />
    </div>
  );
};

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<"user" | "admin" | null>(null);

  const emptyUser: UserState = {
    username: "", email: "", phone: "", country: "Togo", sponsor: "", password: "",
    isActive: false, activatedAt: "", balance: 0, totalProfit: 0,
    totalWithdrawn: 0, welcomeBonus: 0, referrals: 0,
    taskDoneToday: false, taskLastDate: "", wheelUsed: false, wheelLastUsed: "", taskWheelLastUsed: "",
    transactions: [],
  };

  // ── Persistance localStorage ──────────────────────────────────────────────
  const load = (key: string, fallback: any) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  };
  const save = (key: string, val: any) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  };

  const [accounts, setAccounts] = useState<UserState[]>(() => load("df_accounts", []));
  const [user, setUser] = useState<UserState>(() => load("df_user", emptyUser));

  // Admin state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskWindow, setTaskWindow] = useState<any>(null);
  const [taskDoneToday, setTaskDoneToday] = useState(false);
  const [initialSponsor, setInitialSponsor] = useState("");

  // Sauvegarde automatique à chaque changement
  useEffect(() => { save("df_accounts", accounts); }, [accounts]);
  useEffect(() => { save("df_user", user); }, [user]);
  // V4 sécurité: données admin uniquement depuis le backend, pas de persistance localStorage.
  
  
  

  const refreshMe = async () => {
    try {
      const fresh = await api.me();
      setUser(fresh);
      setAccounts(prev => {
        const exists = prev.some(a => a.email === fresh.email);
        return exists ? prev.map(a => a.email === fresh.email ? fresh : a) : [...prev, fresh];
      });
      try {
        const refs = await api.referrals();
        if (refs?.flat) setAccounts([fresh, ...refs.flat]);
      } catch {}
      return fresh;
    } catch { return null; }
  };

  const loadAdminData = async () => {
    try {
      const [users, deps, withs, taskList] = await Promise.all([api.adminUsers(), api.adminDeposits(), api.adminWithdrawals(), api.adminTasks()]);
      setAdminUsers(users); setDeposits(deps); setWithdrawals(withs); setTasks(taskList);
    } catch {}
  };

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref") || "";
    if (ref) { setInitialSponsor(ref); setPage("register"); }
    const token = localStorage.getItem("gf_access");
    if (token) refreshMe();
    api.tasks().then((r: any) => {
      setTasks(Array.isArray(r) ? r : (r?.tasks || []));
      if (r?.window) setTaskWindow(r.window);
      if (typeof r?.doneToday === "boolean") setTaskDoneToday(r.doneToday);
    }).catch(() => {});
  }, []);

  const now = new Date().toISOString();
  const today = now.split("T")[0];

  const addTx = (tx: Omit<Transaction, "id" | "date">, balanceDelta = 0) => {
    const newTx: Transaction = { ...tx, id: `tx-${Date.now()}`, date: now };
    setUser(u => {
      const updated = { ...u, transactions: [...u.transactions, newTx], balance: u.balance + balanceDelta, totalProfit: balanceDelta > 0 ? u.totalProfit + balanceDelta : u.totalProfit };
      setAccounts(prev => prev.map(a => a.email === u.email ? updated : a));
      return updated;
    });
    return newTx;
  };

  // ── Dépôt ──
  const handleDeposit = async (amount: number, method: string, txRef: string) => {
    try {
      const resp = await api.deposit(amount, method, txRef);
      if (resp?.user) setUser(resp.user);
      else await refreshMe();
      if (mode === "admin") await loadAdminData();
    } catch (e: any) { alert(e.message || "Dépôt impossible"); }
  };

  const handleActivationDeposit = async (amount: number = 3500, method: string = "Mobile Money", txRef: string = `activation-${Date.now()}`) => {
    try {
      const resp = await api.deposit(amount, method, txRef);
      const fresh = resp?.user || await api.me();
      setUser(fresh);
      setAccounts(prev => prev.map(a => a.email === fresh.email ? fresh : a));
      alert("Paiement reçu. Votre compte est activé automatiquement.");
      setPage("dashboard");
    } catch (e: any) { alert(e.message || "Dépôt d’activation impossible"); }
  };

  // ── Retrait : débite le solde et enregistre côté admin ──
  const handleWithdraw = async (amount: number, method: string) => {
    try {
      await api.withdraw(amount, method);
      await refreshMe();
    } catch (e: any) { alert(e.message || "Retrait impossible"); }
  };

  // ── Tâche ──
  const handleTask = async (reward: number) => {
    try {
      const task = tasks.find((t: any) => Number(t.reward) === Number(reward)) || tasks[0];
      const fresh = await api.completeTask(task?.id || "default");
      setUser(fresh);
      setAccounts(prev => prev.map(a => a.email === fresh.email ? fresh : a));
      try { const r = await api.tasks(); setTaskWindow(r.window); setTaskDoneToday(!!r.doneToday); setTasks(r.tasks || r); } catch {}
    } catch (e: any) { alert(e.message || "Tâche impossible"); }
  };

  // ── Roue de fortune (une seule fois, 100 XOF fixe) ──
  const handleSpin = async (amount: number) => {
    try {
      const fresh = await api.spin("signup", amount);
      setUser(fresh);
      setAccounts(prev => prev.map(a => a.email === fresh.email ? fresh : a));
    } catch (e: any) { alert(e.message || "Roue impossible"); }
  };

  // ── Roue des tâches ──
  const handleTaskSpin = async (amount: number) => {
    try {
      const fresh = await api.spin("task", amount);
      setUser(fresh);
      setAccounts(prev => prev.map(a => a.email === fresh.email ? fresh : a));
    } catch (e: any) { alert(e.message || "Roue des tâches impossible"); }
  };

  // Créneau raté → bloquer 2 jours depuis 8h du jour raté
  const handleTaskWheelMiss = (missedAt: string) => {
    setUser(u => {
      if (u.taskWheelLastUsed && u.taskWheelLastUsed.split("T")[0] === missedAt.split("T")[0]) return u;
      const updated = { ...u, taskWheelLastUsed: missedAt };
      setAccounts(prev => prev.map(a => a.email === u.email ? updated : a));
      return updated;
    });
  };

  const adminPages = ["admin-dashboard", "admin-users", "admin-deposits", "admin-withdrawals", "admin-tasks", "admin-parrainage"];

  const go = (p: string) => {
    if (adminPages.includes(p) && mode !== "admin") {
      setPage("dashboard"); setMenuOpen(false); return;
    }
    if (mode === "user" && !user.isActive && !["login", "register", "activation"].includes(p)) {
      setPage("activation"); setMenuOpen(false); return;
    }
    setPage(p); setMenuOpen(false);
  };

  const handleLogin = async (_role: string, inputUsername: string, inputPassword: string) => {
    try {
      const data = await api.login(inputUsername, inputPassword);
      saveTokens(data.tokens);
      setUser(data.user);
      setAccounts(prev => {
        const exists = prev.some(a => a.email === data.user.email);
        return exists ? prev.map(a => a.email === data.user.email ? data.user : a) : [...prev, data.user];
      });
      setMode(data.role === "admin" ? "admin" : "user");
      if (data.role === "admin") { await loadAdminData(); setPage("admin-dashboard"); }
      else if (data.user.isActive) setPage("dashboard"); else setPage("activation");
    } catch { return false; }
  };

  const handleRegister = async (data: any, onError: (msg: string) => void) => {
    try {
      const res = await api.register(data);
      saveTokens(res.tokens);
      setAccounts(prev => [...prev.filter(a => a.email !== res.user.email), res.user]);
      setUser(res.user);
      setMode("user"); setPage("activation");
    } catch (e: any) {
      onError(e.message || "Inscription impossible.");
    }
  };

  // Commissions versées automatiquement quand un nouveau membre est ACTIVÉ (après paiement)
  const handleActivated = async () => {
    try {
      const fresh = await api.activate();
      setUser(fresh);
      setAccounts(prev => prev.map(a => a.email === fresh.email ? fresh : a));
      setPage("dashboard");
    } catch (e: any) { alert(e.message || "Activation impossible"); }
  };

  const logout = () => {
    setMode(null);
    setUser(emptyUser);
    try { localStorage.removeItem("df_user"); clearTokens(); } catch {}
    setPage("login"); setMenuOpen(false);
  };

  // V4 sécurité: pas de changement de mot de passe côté frontend.
  const handleDirectReset = async (_email: string, _newPassword: string) => {
    alert("Réinitialisation directe désactivée pour sécurité. Cette action doit passer par un flux email côté serveur ou par l’admin.");
  };

  const isPublic = ["login", "register", "activation", "forgot"].includes(page);
  const isAdminPage = adminPages.includes(page);
  const adminStats = {
    users: adminUsers.length,
    pendingDep: deposits.filter(d => d.status === "en attente").length,
    pendingWith: withdrawals.filter(w => w.status === "en attente").length,
  };

  if (page === "forgot")     return <ForgotPasswordScreen onBack={() => setPage("login")} accounts={accounts} onDirectReset={handleDirectReset} />;
  if (page === "activation") return <ActivationScreen user={user} onActivationDeposit={handleActivationDeposit} />;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {!isPublic && (
        <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#ffffffee", borderBottom: `1px solid ${C.borderGray}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)" }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.text, padding: "4px 8px" }}>{menuOpen ? "✕" : "☰"}</button>
          <Logo size="sm" />
          {isAdminPage
            ? <Badge color={C.danger}>Admin</Badge>
            : <div onClick={() => go("profile")} style={{ width: 36, height: 36, borderRadius: "50%", background: C.primary + "22", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: C.primary, cursor: "pointer" }}>
                {(user.username?.[0] ?? "?").toUpperCase()}
              </div>
          }
        </div>
      )}

      {menuOpen && isAdminPage && <AdminSidebar page={page} go={(p: string) => { go(p); setMenuOpen(false); }} logout={logout} stats={adminStats} />}
      {menuOpen && !isPublic && !isAdminPage && <UserSidebar page={page} go={(p: string) => { go(p); setMenuOpen(false); }} logout={logout} user={user} />}

      <div>
        {page === "login"         && <LoginScreen onLogin={handleLogin} onRegister={() => setPage("register")} onForgot={() => setPage("forgot")} isRegistered={accounts.length > 0} />}
        {page === "register"      && <RegisterScreen onDone={handleRegister} onBack={() => setPage("login")} existingEmails={accounts.map(a => a.email)} initialSponsor={initialSponsor} />}
        {page === "dashboard"     && <DashboardScreen user={user} go={go} />}
        {page === "transactions"  && <TransactionsScreen user={user} />}
        {page === "deposit"       && <DepositScreen user={user} onDeposit={handleDeposit} />}
        {page === "withdraw"      && <WithdrawScreen user={user} onWithdraw={handleWithdraw} />}
        {page === "team"          && <TeamScreen user={user} accounts={accounts} />}
        {page === "tasks"         && <TasksScreen user={user} tasks={tasks.filter(t => t.active)} taskWindow={taskWindow} taskDoneToday={taskDoneToday} onComplete={handleTask} onTaskSpin={handleTaskSpin} onTaskWheelMiss={handleTaskWheelMiss} />}
        {page === "wheel"         && <WheelScreen user={user} onSpin={handleSpin} />}
        {page === "community"     && <CommunityScreen />}
        {page === "profile"       && <ProfileScreen user={user} />}
        {page === "contact"       && <ContactScreen />}

        {page === "admin-dashboard"   && <AdminDashboard users={adminUsers} deposits={deposits} withdrawals={withdrawals} tasks={tasks} />}
        {page === "admin-users"       && <AdminUsers users={adminUsers} onToggleActive={async (id: string) => { try { await api.toggleUser(id); await loadAdminData(); } catch (e: any) { alert(e.message || "Action refusée par le backend"); } }} />}
        {page === "admin-deposits"    && <AdminDeposits deposits={deposits} onValidate={async (id: string, status: string) => {
          try { await api.updateDeposit(id, status); await loadAdminData(); await refreshMe(); return; } catch (e: any) { alert(e.message || "Validation refusée par le backend"); }
        }} />}
        {page === "admin-withdrawals" && <AdminWithdrawals withdrawals={withdrawals} onValidate={async (id: string, status: string) => {
          try { await api.updateWithdrawal(id, status); await loadAdminData(); await refreshMe(); return; } catch (e: any) { alert(e.message || "Validation refusée par le backend"); }
        }} />}
        {page === "admin-tasks"       && <AdminTasks tasks={tasks} onAdd={async (t: any) => { try { await api.addTask(t); await loadAdminData(); } catch (e: any) { alert(e.message || "Création refusée par le backend"); } }} onDelete={async (id: string) => { try { await api.deleteTask(id); await loadAdminData(); } catch (e: any) { alert(e.message || "Suppression refusée par le backend"); } }} />}
        {page === "admin-parrainage"  && <AdminParrainage users={adminUsers} />}
      </div>
    </div>
  );
}
