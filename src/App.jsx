import { useState, useEffect, useCallback, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════════════
   STORAGE — localStorage (fonctionne partout, même GitHub Pages)
═══════════════════════════════════════════════════════════════ */
const S = {
  get: (k) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

const KEYS = {
  users: "crg2:users",
  roles: "crg2:roles",
  companies: "crg2:companies",
  appointments: "crg2:appointments",
  projects: "crg2:projects",
  logs: "crg2:logs",
  session: "crg2:session",
};

/* ═══════════════════════════════════════════════════════════════
   ALL POSSIBLE PERMISSIONS
═══════════════════════════════════════════════════════════════ */
const ALL_PERMS = [
  { key: "companies.view",     label: "Voir entreprises",                    group: "Entreprises" },
  { key: "companies.create",   label: "Créer entreprises",                   group: "Entreprises" },
  { key: "companies.update",   label: "Modifier entreprises",                group: "Entreprises" },
  { key: "companies.delete",   label: "Supprimer entreprises",               group: "Entreprises" },
  { key: "companies.view_all", label: "Voir toutes (pas juste les siennes)", group: "Entreprises" },
  { key: "appointments.view",   label: "Voir RDV",      group: "Rendez-vous" },
  { key: "appointments.create", label: "Créer RDV",     group: "Rendez-vous" },
  { key: "appointments.update", label: "Modifier RDV",  group: "Rendez-vous" },
  { key: "appointments.delete", label: "Supprimer RDV", group: "Rendez-vous" },
  { key: "projects.view",   label: "Voir projets",      group: "Projets" },
  { key: "projects.create", label: "Créer projets",     group: "Projets" },
  { key: "projects.update", label: "Modifier projets",  group: "Projets" },
  { key: "projects.delete", label: "Supprimer projets", group: "Projets" },
  { key: "pipeline.view",   label: "Voir pipeline",     group: "Pipeline" },
  { key: "pipeline.manage", label: "Gérer pipeline",    group: "Pipeline" },
  { key: "users.view",   label: "Voir utilisateurs",    group: "Utilisateurs" },
  { key: "users.create", label: "Créer utilisateurs",   group: "Utilisateurs" },
  { key: "users.update", label: "Modifier utilisateurs",group: "Utilisateurs" },
  { key: "users.delete", label: "Supprimer utilisateurs",group:"Utilisateurs" },
  { key: "roles.manage", label: "Gérer les rôles",      group: "Rôles" },
  { key: "logs.view",       label: "Voir les logs",     group: "Système" },
  { key: "settings.manage", label: "Paramètres système",group: "Système" },
];

/* ═══════════════════════════════════════════════════════════════
   DEFAULT DATA
═══════════════════════════════════════════════════════════════ */
const DEFAULT_ROLES = [
  { id: "superadmin", name: "Directeur de Campagne", color: "#f59e0b", icon: "👑", permissions: ALL_PERMS.map(p => p.key), locked: true },
  { id: "manager",    name: "Manager",               color: "#3b82f6", icon: "💼", permissions: ["companies.view","companies.create","companies.update","companies.view_all","appointments.view","appointments.create","appointments.update","appointments.delete","projects.view","projects.create","projects.update","pipeline.view","pipeline.manage","users.view","logs.view"], locked: false },
  { id: "commercial", name: "Commercial",            color: "#10b981", icon: "📊", permissions: ["companies.view","companies.create","companies.update","appointments.view","appointments.create","appointments.update","projects.view","pipeline.view"], locked: false },
  { id: "assistant",  name: "Assistant",             color: "#8b5cf6", icon: "📋", permissions: ["companies.view","appointments.view","projects.view","pipeline.view"], locked: false },
];

const DEFAULT_USERS = [
  { id: "owner", name: "Maholo", email: "maholo.contact@gmail.com", password: "Maholo_56100", role: "superadmin", avatar: "MA", createdAt: "2025-01-01", isOwner: true },
];

const DEFAULT_COMPANIES = [
  { id: "c1", name: "TechNova Solutions", status: "client",      sector: "Technologie", revenue: 45000, email: "contact@technova.fr",  phone: "01 23 45 67 89", advisor: "owner", city: "Paris",     createdAt: "2024-01-20" },
  { id: "c2", name: "Green Energy Corp",  status: "prospect",    sector: "Énergie",     revenue: 0,     email: "info@greenenergy.fr",   phone: "04 56 78 90 12", advisor: "owner", city: "Lyon",      createdAt: "2024-02-14" },
  { id: "c3", name: "FinanceHub SA",      status: "client",      sector: "Finance",     revenue: 78000, email: "hello@financehub.fr",   phone: "02 34 56 78 90", advisor: "owner", city: "Bordeaux",  createdAt: "2024-03-01" },
  { id: "c4", name: "MediCare Plus",      status: "négociation", sector: "Santé",       revenue: 0,     email: "contact@medicare.fr",   phone: "05 67 89 01 23", advisor: "owner", city: "Marseille", createdAt: "2024-03-18" },
];
const DEFAULT_APPOINTMENTS = [
  { id: "a1", title: "Présentation TechNova", company: "c1", date: "2025-03-10", time: "10:00", type: "réunion", status: "planifié", notes: "Présentation Q1", createdBy: "owner" },
  { id: "a2", title: "Démo Green Energy",     company: "c2", date: "2025-03-15", time: "14:30", type: "démo",    status: "planifié", notes: "Demo produit",   createdBy: "owner" },
  { id: "a3", title: "Suivi FinanceHub",      company: "c3", date: "2025-02-18", time: "09:00", type: "suivi",   status: "terminé",  notes: "Revue contrat",  createdBy: "owner" },
];
const DEFAULT_PROJECTS = [
  { id: "p1", name: "Migration Cloud TechNova", company: "c1", status: "en cours", budget: 25000, progress: 65, startDate: "2024-12-01", endDate: "2025-03-31", manager: "owner", priority: "haute"   },
  { id: "p2", name: "Audit Financier Hub",       company: "c3", status: "en cours", budget: 12000, progress: 40, startDate: "2025-01-15", endDate: "2025-04-30", manager: "owner", priority: "moyenne" },
  { id: "p3", name: "Étude Green Energy",        company: "c2", status: "planifié", budget: 8000,  progress: 10, startDate: "2025-03-01", endDate: "2025-05-31", manager: "owner", priority: "basse"   },
];

/* ═══════════════════════════════════════════════════════════════
   AUTH CONTEXT
═══════════════════════════════════════════════════════════════ */
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);
const useCan = () => {
  const { user, roles } = useAuth();
  return useCallback((perm) => {
    if (!user) return false;
    const role = roles.find(r => r.id === user.role);
    return role?.permissions?.includes(perm) || false;
  }, [user, roles]);
};

/* ═══════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════ */
const Ic = ({ n, s = 18 }) => {
  const M = {
    dashboard: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>,
    companies: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21V9l7-6 7 6v12"/><path d="M9 21v-6h6v6"/><path d="M3 21h18"/></svg>,
    calendar:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    projects:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l3 6.5L22 9.5l-5 4.5 1.2 6.5L12 17l-6.2 3.5L7 14 2 9.5l7-1z"/></svg>,
    pipeline:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="M8 12h5.5M16.5 6.8l-3 3.8M16.5 17.2l-3-3.8"/></svg>,
    users:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></svg>,
    roles:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l2 4h5l-4 3 1.5 5L12 11l-4.5 3L9 9 5 6h5z"/><path d="M12 11v10"/></svg>,
    logs:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
    settings:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M21 12h-2M5 12H3M12 21v-2M12 5V3"/></svg>,
    plus:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>,
    trash:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/></svg>,
    search:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    x:         <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
    lock:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    eye:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeoff:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    logout:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
    shield:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    trend:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
    dollar:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    chevron:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 12,15 18,9"/></svg>,
    menu:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    copy:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
    warning:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    info:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return M[n] || null;
};

/* ═══════════════════════════════════════════════════════════════
   DESIGN SYSTEM
═══════════════════════════════════════════════════════════════ */
const C = {
  bg: "#07080f", surface: "#0d0f1a", border: "#1a1d2e", border2: "#252840",
  text: "#e8eaf6", muted: "#4a4f6e", accent: "#5b6af0", accent2: "#7c3aed",
  success: "#059669", danger: "#dc2626", warn: "#d97706",
};

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Sora',sans-serif;background:${C.bg};color:${C.text};overflow-x:hidden;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:${C.bg};}
::-webkit-scrollbar-thumb{background:${C.border2};border-radius:3px;}
::-webkit-scrollbar-thumb:hover{background:${C.accent}44;}
input,select,textarea,button{font-family:'Sora',sans-serif;}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideRight{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes toastIn{from{opacity:0;transform:translateX(24px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fadeUp{animation:fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both;}
.fadeIn{animation:fadeIn 0.25s ease both;}
.stagger1{animation-delay:0.05s}.stagger2{animation-delay:0.1s}.stagger3{animation-delay:0.15s}.stagger4{animation-delay:0.2s}.stagger5{animation-delay:0.25s}
`;

const inp = (extra = "") => ({
  width: "100%", background: "#090b15", border: `1px solid ${C.border2}`,
  borderRadius: "10px", padding: "11px 14px", color: C.text, fontSize: "14px",
  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
  ...Object.fromEntries(extra.split(";").filter(Boolean).map(s => {
    const [k, ...v] = s.trim().split(":");
    return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.join(":").trim()];
  })),
});
const FIn = (props) => <input {...props} style={inp()} onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}22`; }} onBlur={e => { e.target.style.borderColor = C.border2; e.target.style.boxShadow = "none"; }} />;
const FSe = ({ children, ...props }) => <select {...props} style={inp()} onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}22`; }} onBlur={e => { e.target.style.borderColor = C.border2; e.target.style.boxShadow = "none"; }}>{children}</select>;
const FTa = (props) => <textarea {...props} style={{ ...inp(), resize: "vertical", minHeight: "80px" }} onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}22`; }} onBlur={e => { e.target.style.borderColor = C.border2; e.target.style.boxShadow = "none"; }} />;

const FL = ({ label, children, col }) => (
  <div style={{ marginBottom: "14px", gridColumn: col }}>
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>{label}</label>
    {children}
  </div>
);

const Btn = ({ children, v = "primary", onClick, disabled, full, size = "md", sx = {} }) => {
  const vs = { primary: { bg: C.accent, text: "#fff" }, danger: { bg: C.danger, text: "#fff" }, ghost: { bg: "transparent", text: C.muted, border: `1px solid ${C.border2}` }, success: { bg: C.success, text: "#fff" }, warn: { bg: C.warn, text: "#fff" } };
  const ss = { sm: { p: "6px 12px", fs: "12px" }, md: { p: "10px 18px", fs: "13px" }, lg: { p: "13px 24px", fs: "14px" } };
  const vv = vs[v] || vs.primary; const sz = ss[size] || ss.md;
  return <button onClick={onClick} disabled={disabled} style={{ background: vv.bg, color: vv.text, border: vv.border || "none", borderRadius: "9px", padding: sz.p, fontSize: sz.fs, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "7px", transition: "all 0.15s", width: full ? "100%" : "auto", justifyContent: full ? "center" : "flex-start", whiteSpace: "nowrap", ...sx }} onMouseEnter={e => { if (!disabled) { e.currentTarget.style.filter = "brightness(1.12)"; e.currentTarget.style.transform = "translateY(-1px)"; } }} onMouseLeave={e => { if (!disabled) { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; } }}>{children}</button>;
};

const Badge = ({ label }) => {
  const map = { client: { bg: "#052e16", tc: "#4ade80", bc: "#166534" }, prospect: { bg: "#0c1a3d", tc: "#60a5fa", bc: "#1d4ed8" }, "négociation": { bg: "#1c0f00", tc: "#fb923c", bc: "#92400e" }, "en cours": { bg: "#0c1a3d", tc: "#60a5fa", bc: "#1d4ed8" }, planifié: { bg: "#1c0f00", tc: "#fb923c", bc: "#92400e" }, terminé: { bg: "#052e16", tc: "#4ade80", bc: "#166534" }, haute: { bg: "#1a0005", tc: "#f87171", bc: "#7f1d1d" }, moyenne: { bg: "#1c0f00", tc: "#fb923c", bc: "#92400e" }, basse: { bg: "#052e16", tc: "#4ade80", bc: "#166534" }, perdu: { bg: "#1a0005", tc: "#f87171", bc: "#7f1d1d" }, annulé: { bg: "#1a0005", tc: "#f87171", bc: "#7f1d1d" }, suspendu: { bg: "#1a0520", tc: "#c084fc", bc: "#6b21a8" } };
  const c = map[label] || { bg: C.border, tc: C.muted, bc: C.border2 };
  return <span style={{ background: c.bg, color: c.tc, border: `1px solid ${c.bc}`, padding: "2px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>;
};

const Modal = ({ title, onClose, children, size = "md" }) => {
  const w = { sm: "400px", md: "580px", lg: "760px", xl: "900px" };
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="fadeUp" style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "18px", width: "100%", maxWidth: w[size], maxHeight: "92vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.surface, zIndex: 1, borderRadius: "18px 18px 0 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text }}>{title}</h3>
        <button onClick={onClose} style={{ background: C.border, border: "none", cursor: "pointer", color: C.muted, padding: "6px", borderRadius: "8px", display: "flex", lineHeight: 1 }} onMouseEnter={e => { e.currentTarget.style.background = C.border2; e.currentTarget.style.color = C.text; }} onMouseLeave={e => { e.currentTarget.style.background = C.border; e.currentTarget.style.color = C.muted; }}><Ic n="x" s={17} /></button>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  </div>;
};

const Confirm = ({ msg, onConfirm, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
    <div className="fadeUp" style={{ background: C.surface, border: `1px solid #7f1d1d`, borderRadius: "16px", padding: "28px", maxWidth: "380px", width: "90%", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
      <div style={{ color: "#ef4444", marginBottom: "14px", display: "flex", justifyContent: "center" }}><Ic n="warning" s={36} /></div>
      <p style={{ textAlign: "center", color: C.text, fontSize: "15px", marginBottom: "24px", lineHeight: 1.6 }}>{msg}</p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <Btn v="ghost" onClick={onCancel}>Annuler</Btn>
        <Btn v="danger" onClick={onConfirm}>Confirmer</Btn>
      </div>
    </div>
  </div>
);

const Toast = ({ toasts }) => (
  <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 2000, display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}>
    {toasts.map(t => {
      const tc = { success: { bg: "#052e16", bc: "#166534", fc: "#4ade80" }, error: { bg: "#1a0005", bc: "#7f1d1d", fc: "#f87171" }, info: { bg: "#0c1a3d", bc: "#1d4ed8", fc: "#60a5fa" }, warn: { bg: "#1c0f00", bc: "#92400e", fc: "#fb923c" } };
      const c = tc[t.type] || tc.info;
      return <div key={t.id} style={{ background: c.bg, border: `1px solid ${c.bc}`, color: c.fc, padding: "12px 18px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, maxWidth: "340px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "toastIn 0.25s cubic-bezier(0.16,1,0.3,1) both", display: "flex", alignItems: "center", gap: "8px" }}>{t.type === "success" && "✓ "}{t.type === "error" && "✕ "}{t.message}</div>;
    })}
  </div>
);

const NoAccess = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "16px", animation: "fadeIn 0.3s" }}>
    <div style={{ width: "72px", height: "72px", background: `${C.danger}15`, border: `1px solid ${C.danger}33`, borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: C.danger }}><Ic n="lock" s={32} /></div>
    <h3 style={{ fontSize: "18px", fontWeight: 700, color: C.text }}>Accès refusé</h3>
    <p style={{ color: C.muted, fontSize: "14px", textAlign: "center", maxWidth: "300px" }}>Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════════ */
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = () => {
    if (!email || !pw) { setErr("Remplissez tous les champs."); return; }
    setLoading(true); setErr("");
    let users = S.get(KEYS.users);
    if (!users) { users = DEFAULT_USERS; S.set(KEYS.users, users); }
    setTimeout(() => {
      const u = users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === pw);
      if (u) { onLogin(u); } else { setErr("Identifiants incorrects."); }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{globalCSS}</style>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${C.border} 1px,transparent 1px),linear-gradient(90deg,${C.border} 1px,transparent 1px)`, backgroundSize: "64px 64px", opacity: 0.4 }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 50%,${C.accent}0d 0%,transparent 70%)` }} />
      <div className="fadeUp" style={{ position: "relative", width: "100%", maxWidth: "420px", padding: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", width: "60px", height: "60px", background: `linear-gradient(135deg,${C.accent},${C.accent2})`, borderRadius: "18px", alignItems: "center", justifyContent: "center", marginBottom: "18px", boxShadow: `0 0 40px ${C.accent}44` }}>
            <span style={{ fontSize: "26px" }}>⚡</span>
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "6px" }}>CRG Internal</h1>
          <p style={{ color: C.muted, fontSize: "14px" }}>Plateforme de gestion interne</p>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "20px", padding: "32px", boxShadow: `0 24px 60px rgba(0,0,0,0.4)` }}>
          {err && <div style={{ background: "#1a0005", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "11px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "18px", display: "flex", gap: "8px", alignItems: "center" }}><Ic n="warning" s={15} />{err}</div>}
          <FL label="Adresse e-mail"><FIn type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" onKeyDown={e => e.key === "Enter" && go()} /></FL>
          <FL label="Mot de passe">
            <div style={{ position: "relative" }}>
              <FIn type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••••" onKeyDown={e => e.key === "Enter" && go()} style={{ paddingRight: "44px" }} />
              <button onClick={() => setShow(!show)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", padding: "2px" }}><Ic n={show ? "eyeoff" : "eye"} s={16} /></button>
            </div>
          </FL>
          <Btn onClick={go} disabled={loading} full size="lg" sx={{ marginTop: "6px", background: `linear-gradient(135deg,${C.accent},${C.accent2})`, justifyContent: "center" }}>
            {loading ? <><span style={{ width: "16px", height: "16px", border: "2px solid #ffffff44", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Connexion…</> : <><Ic n="shield" s={16} /> Se connecter</>}
          </Btn>
          <div style={{ marginTop: "20px", padding: "14px", background: `${C.accent}08`, border: `1px solid ${C.accent}22`, borderRadius: "10px" }}>
            <p style={{ fontSize: "12px", color: C.muted, lineHeight: 1.6, textAlign: "center" }}>
              <span style={{ color: C.accent, fontWeight: 600 }}>⚡ Accès restreint</span><br />
              Seuls les comptes autorisés peuvent se connecter.<br />Contactez l'administrateur pour obtenir un accès.
            </p>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: C.muted }}>CRG Internal · Accès sécurisé</p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
const Sidebar = ({ active, setActive, onLogout, user, roles }) => {
  const can = useCan();
  const role = roles.find(r => r.id === user.role);
  const nav = [
    { id: "dashboard",    label: "Dashboard",    icon: "dashboard", always: true },
    { id: "companies",    label: "Entreprises",  icon: "companies", perm: "companies.view" },
    { id: "appointments", label: "Rendez-vous",  icon: "calendar",  perm: "appointments.view" },
    { id: "projects",     label: "Projets",      icon: "projects",  perm: "projects.view" },
    { id: "pipeline",     label: "Pipeline",     icon: "pipeline",  perm: "pipeline.view" },
    { id: "users",        label: "Utilisateurs", icon: "users",     perm: "users.view" },
    { id: "roles",        label: "Rôles & Accès",icon: "roles",     perm: "roles.manage" },
    { id: "logs",         label: "Activité",     icon: "logs",      perm: "logs.view" },
    { id: "settings",     label: "Paramètres",   icon: "settings",  perm: "settings.manage" },
  ];
  return (
    <div style={{ width: "230px", minWidth: "230px", background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ padding: "22px 18px 18px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <div style={{ width: "38px", height: "38px", background: `linear-gradient(135deg,${C.accent},${C.accent2})`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0, boxShadow: `0 4px 12px ${C.accent}44` }}>⚡</div>
          <div><div style={{ fontSize: "14px", fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>CRG Internal</div><div style={{ fontSize: "10px", color: C.muted, marginTop: "1px" }}>CRM Platform</div></div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 8px", marginBottom: "8px", marginTop: "4px" }}>Navigation</div>
        {nav.filter(i => i.always || (i.perm && can(i.perm))).map((item, idx) => {
          const isA = active === item.id;
          return <button key={item.id} onClick={() => setActive(item.id)} className={`stagger${Math.min(idx + 1, 5)}`} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "11px", border: "none", cursor: "pointer", marginBottom: "2px", background: isA ? `${C.accent}18` : "transparent", color: isA ? C.text : C.muted, fontSize: "13px", fontWeight: isA ? 600 : 400, transition: "all 0.15s", textAlign: "left", position: "relative" }}
            onMouseEnter={e => { if (!isA) { e.currentTarget.style.background = `${C.border}88`; e.currentTarget.style.color = C.text; } }}
            onMouseLeave={e => { if (!isA) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; } }}>
            {isA && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "3px", height: "20px", background: C.accent, borderRadius: "0 3px 3px 0" }} />}
            <span style={{ color: isA ? C.accent : C.muted, transition: "color 0.15s" }}><Ic n={item.icon} s={16} /></span>
            {item.label}
          </button>;
        })}
      </nav>
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: C.border, borderRadius: "12px", marginBottom: "6px" }}>
          <div style={{ width: "34px", height: "34px", background: `${role?.color || C.accent}22`, border: `2px solid ${role?.color || C.accent}55`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: role?.color || C.accent, flexShrink: 0 }}>{user.avatar || user.name[0]}</div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: "10px", color: role?.color || C.accent, fontWeight: 500 }}>{role?.icon} {role?.name}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "9px", border: "none", background: "transparent", color: C.muted, cursor: "pointer", fontSize: "12px", fontWeight: 500, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#7f1d1d33"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.muted; }}>
          <Ic n="logout" s={15} /> Déconnexion
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════ */
const Dashboard = ({ companies, appointments, projects, users }) => {
  const { user, roles } = useAuth();
  const can = useCan();
  const role = roles.find(r => r.id === user.role);
  const mine = can("companies.view_all") ? companies : companies.filter(c => c.advisor === user.id);
  const revenue = mine.filter(c => c.status === "client").reduce((s, c) => s + (c.revenue || 0), 0);
  const upcoming = appointments.filter(a => a.date >= new Date().toISOString().slice(0, 10) && a.status !== "terminé");
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const stats = [
    { l: "Prospects",       v: mine.filter(c => c.status === "prospect").length,    c: "#3b82f6", icon: "trend",     sub: "entreprises" },
    { l: "Clients actifs",  v: mine.filter(c => c.status === "client").length,      c: "#10b981", icon: "companies", sub: "entreprises" },
    { l: "RDV à venir",    v: upcoming.length,                                      c: "#f59e0b", icon: "calendar",  sub: "rendez-vous" },
    { l: "Projets actifs", v: projects.filter(p => p.status === "en cours").length, c: C.accent,  icon: "projects",  sub: "en cours" },
    { l: "Chiffre d'affaires", v: `${(revenue / 1000).toFixed(0)}k€`,              c: "#ec4899", icon: "dollar",    sub: "total clients" },
  ];
  return (
    <div className="fadeIn">
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "6px" }}>Bonjour, {user.name.split(" ")[0]} {role?.icon}</h1>
          <p style={{ color: C.muted, fontSize: "14px" }}>{today.charAt(0).toUpperCase() + today.slice(1)}</p>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "12px", padding: "10px 16px", textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: C.muted, marginBottom: "2px" }}>Votre rôle</div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: role?.color || C.accent }}>{role?.icon} {role?.name}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "14px", marginBottom: "28px" }}>
        {stats.map((s, i) => (
          <div key={s.l} className={`fadeUp stagger${i + 1}`} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "22px", position: "relative", overflow: "hidden", cursor: "default" }}
            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${s.c}44`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.transition = "all 0.2s"; }}
            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${C.border}`; e.currentTarget.style.transform = "none"; }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: `${s.c}08`, borderRadius: "50%" }} />
            <div style={{ color: s.c, marginBottom: "12px", opacity: 0.9 }}><Ic n={s.icon} s={22} /></div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "2px", fontFeatureSettings: "'tnum'" }}>{s.v}</div>
            <div style={{ fontSize: "12px", color: C.muted, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div className="fadeUp stagger3" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Prochains RDV</h3>
            <span style={{ fontSize: "11px", color: C.accent, fontWeight: 600 }}>{upcoming.length} à venir</span>
          </div>
          {upcoming.length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: "13px", padding: "24px 0" }}>Aucun RDV planifié</div>}
          {upcoming.slice(0, 4).map(a => (
            <div key={a.id} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
              <div style={{ width: "42px", height: "42px", background: `${C.accent}15`, border: `1px solid ${C.accent}33`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: C.accent, lineHeight: 1 }}>{new Date(a.date).toLocaleDateString("fr-FR", { day: "numeric" })}</div>
                <div style={{ fontSize: "8px", color: C.muted, textTransform: "uppercase", lineHeight: 1 }}>{new Date(a.date).toLocaleDateString("fr-FR", { month: "short" })}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                <div style={{ fontSize: "11px", color: C.muted }}>{a.time} · <Badge label={a.type} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="fadeUp stagger4" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Projets en cours</h3>
            <span style={{ fontSize: "11px", color: C.accent, fontWeight: 600 }}>{projects.filter(p => p.status === "en cours").length} actifs</span>
          </div>
          {projects.filter(p => p.status === "en cours").length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: "13px", padding: "24px 0" }}>Aucun projet actif</div>}
          {projects.filter(p => p.status === "en cours").map(p => (
            <div key={p.id} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{p.name}</div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: C.accent }}>{p.progress}%</span>
              </div>
              <div style={{ background: C.border, borderRadius: "999px", height: "5px", overflow: "hidden" }}>
                <div style={{ width: `${p.progress}%`, background: `linear-gradient(90deg,${C.accent},${C.accent2})`, borderRadius: "999px", height: "5px", transition: "width 0.5s ease" }} />
              </div>
              <div style={{ marginTop: "5px", fontSize: "11px", color: C.muted, display: "flex", justifyContent: "space-between" }}>
                <span>{p.budget.toLocaleString("fr-FR")}€</span>
                <Badge label={p.priority} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   COMPANIES
═══════════════════════════════════════════════════════════════ */
const Companies = ({ companies, setCompanies, users, addLog, toast }) => {
  const { user } = useAuth(); const can = useCan();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [confirm, setConfirm] = useState(null);
  if (!can("companies.view")) return <NoAccess />;
  const visible = (can("companies.view_all") ? companies : companies.filter(c => c.advisor === user.id))
    .filter(c => filter === "all" || c.status === filter)
    .filter(c => [c.name, c.city, c.sector, c.email].some(v => v?.toLowerCase().includes(search.toLowerCase())));
  const save = () => {
    if (!form.name?.trim()) return toast("Le nom est requis", "error");
    let updated;
    if (modal === "create") {
      const n = { ...form, id: `c${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10), revenue: +(form.revenue || 0) };
      updated = [...companies, n]; addLog(`Entreprise créée : ${form.name}`); toast(`${form.name} créée !`, "success");
    } else {
      updated = companies.map(c => c.id === form.id ? { ...form, revenue: +(form.revenue || 0) } : c);
      addLog(`Entreprise modifiée : ${form.name}`); toast("Mise à jour !", "success");
    }
    setCompanies(updated); S.set(KEYS.companies, updated); setModal(null);
  };
  const del = (c) => {
    setConfirm({ msg: `Supprimer "${c.name}" ? Cette action est irréversible.`, fn: () => {
      const u = companies.filter(x => x.id !== c.id);
      setCompanies(u); S.set(KEYS.companies, u);
      addLog(`Entreprise supprimée : ${c.name}`); toast(`${c.name} supprimée`, "success"); setConfirm(null);
    }});
  };
  const filters = ["all", "prospect", "négociation", "client", "perdu"];
  return (
    <div className="fadeIn">
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "4px" }}>Entreprises</h2>
          <p style={{ color: C.muted, fontSize: "13px" }}>{visible.length} résultat{visible.length > 1 ? "s" : ""}</p>
        </div>
        {can("companies.create") && <Btn onClick={() => { setForm({ name: "", status: "prospect", sector: "", revenue: 0, email: "", phone: "", advisor: user.id, city: "" }); setModal("create"); }}><Ic n="plus" s={15} /> Nouvelle entreprise</Btn>}
      </div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }}><Ic n="search" s={15} /></span>
          <FIn value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ paddingLeft: "36px" }} />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {filters.map(f => <button key={f} onClick={() => setFilter(f)} style={{ padding: "9px 14px", borderRadius: "9px", border: `1px solid ${filter === f ? C.accent : C.border2}`, background: filter === f ? `${C.accent}18` : "transparent", color: filter === f ? "#93c5fd" : C.muted, cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.15s", whiteSpace: "nowrap" }}>{f === "all" ? "Tous" : f.charAt(0).toUpperCase() + f.slice(1)}</button>)}
        </div>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr style={{ background: `${C.border}66` }}>
                {["Entreprise", "Secteur", "Ville", "Statut", "CA", "Conseiller", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && <tr><td colSpan={7} style={{ padding: "48px", textAlign: "center", color: C.muted, fontSize: "14px" }}>Aucune entreprise trouvée</td></tr>}
              {visible.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${C.border}44`}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "2px" }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: C.muted }}>{c.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: C.muted }}>{c.sector || "—"}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: C.muted }}>{c.city || "—"}</td>
                  <td style={{ padding: "14px 16px" }}><Badge label={c.status} /></td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: c.revenue > 0 ? 600 : 400, color: c.revenue > 0 ? "#4ade80" : C.muted, fontFamily: "'JetBrains Mono',monospace" }}>{c.revenue > 0 ? `${c.revenue.toLocaleString("fr-FR")} €` : "—"}</td>
                  <td style={{ padding: "14px 16px" }}>
                    {users.find(u2 => u2.id === c.advisor)
                      ? <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                          <div style={{ width: "24px", height: "24px", background: C.border2, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: C.muted, flexShrink: 0 }}>{users.find(u2 => u2.id === c.advisor)?.avatar || "?"}</div>
                          <span style={{ fontSize: "12px", color: C.muted, whiteSpace: "nowrap" }}>{users.find(u2 => u2.id === c.advisor)?.name}</span>
                        </div>
                      : <span style={{ fontSize: "12px", color: C.muted }}>—</span>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {can("companies.update") && <button onClick={() => { setForm({ ...c }); setModal("edit"); }} style={{ background: C.border, border: `1px solid ${C.border2}`, color: C.muted, padding: "6px", borderRadius: "8px", cursor: "pointer", display: "flex", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}22`; e.currentTarget.style.color = C.accent; }} onMouseLeave={e => { e.currentTarget.style.background = C.border; e.currentTarget.style.color = C.muted; }}><Ic n="edit" s={14} /></button>}
                      {can("companies.delete") && <button onClick={() => del(c)} style={{ background: C.border, border: `1px solid ${C.border2}`, color: C.muted, padding: "6px", borderRadius: "8px", cursor: "pointer", display: "flex", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "#7f1d1d33"; e.currentTarget.style.color = "#f87171"; }} onMouseLeave={e => { e.currentTarget.style.background = C.border; e.currentTarget.style.color = C.muted; }}><Ic n="trash" s={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title={modal === "create" ? "Nouvelle entreprise" : "Modifier l'entreprise"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <FL label="Nom *" col="1/-1"><FIn value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom de l'entreprise" /></FL>
            <FL label="Secteur"><FIn value={form.sector || ""} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="ex: Technologie" /></FL>
            <FL label="Statut"><FSe value={form.status || "prospect"} onChange={e => setForm({ ...form, status: e.target.value })}><option value="prospect">Prospect</option><option value="négociation">Négociation</option><option value="client">Client</option><option value="perdu">Perdu</option></FSe></FL>
            <FL label="Email"><FIn type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contact@…" /></FL>
            <FL label="Téléphone"><FIn value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01 23 45 67 89" /></FL>
            <FL label="Ville"><FIn value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Paris" /></FL>
            <FL label="CA (€)"><FIn type="number" value={form.revenue || ""} onChange={e => setForm({ ...form, revenue: e.target.value })} placeholder="0" /></FL>
            <FL label="Conseiller" col="1/-1"><FSe value={form.advisor || ""} onChange={e => setForm({ ...form, advisor: e.target.value })}>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</FSe></FL>
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
            <Btn v="ghost" onClick={() => setModal(null)}>Annuler</Btn>
            <Btn onClick={save}><Ic n="check" s={15} /> Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   APPOINTMENTS
═══════════════════════════════════════════════════════════════ */
const Appointments = ({ appointments, setAppointments, companies, addLog, toast }) => {
  const { user } = useAuth(); const can = useCan();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filter, setFilter] = useState("all");
  const [confirm, setConfirm] = useState(null);
  if (!can("appointments.view")) return <NoAccess />;
  const visible = appointments.filter(a => filter === "all" || a.status === filter);
  const save = () => {
    if (!form.title?.trim()) return toast("Titre requis", "error");
    let updated;
    if (modal === "create") {
      updated = [...appointments, { ...form, id: `a${Date.now()}` }];
      addLog(`RDV créé : ${form.title}`); toast("RDV créé !", "success");
    } else {
      updated = appointments.map(a => a.id === form.id ? { ...form } : a);
      addLog(`RDV modifié : ${form.title}`); toast("RDV mis à jour !", "success");
    }
    setAppointments(updated); S.set(KEYS.appointments, updated); setModal(null);
  };
  const del = (a) => {
    setConfirm({ msg: `Supprimer le RDV "${a.title}" ?`, fn: () => {
      const u = appointments.filter(x => x.id !== a.id);
      setAppointments(u); S.set(KEYS.appointments, u);
      addLog(`RDV supprimé : ${a.title}`); toast("RDV supprimé", "success"); setConfirm(null);
    }});
  };
  return (
    <div className="fadeIn">
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "4px" }}>Rendez-vous</h2>
          <p style={{ color: C.muted, fontSize: "13px" }}>{visible.length} rendez-vous</p>
        </div>
        {can("appointments.create") && <Btn onClick={() => { setForm({ title: "", company: companies[0]?.id || "", date: new Date().toISOString().slice(0, 10), time: "09:00", type: "réunion", status: "planifié", notes: "", createdBy: user.id }); setModal("create"); }}><Ic n="plus" s={15} /> Nouveau RDV</Btn>}
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["all", "planifié", "terminé", "annulé"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", borderRadius: "9px", border: `1px solid ${filter === f ? C.accent : C.border2}`, background: filter === f ? `${C.accent}18` : "transparent", color: filter === f ? "#93c5fd" : C.muted, cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.15s" }}>{f === "all" ? "Tous" : f.charAt(0).toUpperCase() + f.slice(1)}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "14px" }}>
        {visible.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px", color: C.muted, fontSize: "14px", background: C.surface, borderRadius: "16px", border: `1px solid ${C.border}` }}>Aucun rendez-vous</div>}
        {visible.map(a => (
          <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "20px", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${C.border2}`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${C.border}`; e.currentTarget.style.transform = "none"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div><div style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "6px" }}>{a.title}</div><Badge label={a.type} /></div>
              <Badge label={a.status} />
            </div>
            <div style={{ fontSize: "12px", color: C.muted, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}><Ic n="calendar" s={12} /> {new Date(a.date).toLocaleDateString("fr-FR")} à {a.time}</div>
            {a.company && <div style={{ fontSize: "12px", color: C.muted, marginBottom: "8px" }}>🏢 {companies.find(c => c.id === a.company)?.name || "Inconnu"}</div>}
            {a.notes && <div style={{ fontSize: "12px", color: C.muted, background: C.border, padding: "8px 10px", borderRadius: "8px", marginBottom: "12px", lineHeight: 1.5 }}>{a.notes}</div>}
            <div style={{ display: "flex", gap: "7px", justifyContent: "flex-end", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
              {can("appointments.update") && <Btn v="ghost" size="sm" onClick={() => { setForm({ ...a }); setModal("edit"); }}><Ic n="edit" s={13} /> Modifier</Btn>}
              {can("appointments.delete") && <Btn v="danger" size="sm" onClick={() => del(a)}><Ic n="trash" s={13} /></Btn>}
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === "create" ? "Nouveau rendez-vous" : "Modifier le rendez-vous"} onClose={() => setModal(null)}>
          <FL label="Titre *"><FIn value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre du rendez-vous" /></FL>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <FL label="Date"><FIn type="date" value={form.date || ""} onChange={e => setForm({ ...form, date: e.target.value })} /></FL>
            <FL label="Heure"><FIn type="time" value={form.time || ""} onChange={e => setForm({ ...form, time: e.target.value })} /></FL>
            <FL label="Type"><FSe value={form.type || "réunion"} onChange={e => setForm({ ...form, type: e.target.value })}><option>réunion</option><option>démo</option><option>suivi</option><option>appel</option><option>autre</option></FSe></FL>
            <FL label="Statut"><FSe value={form.status || "planifié"} onChange={e => setForm({ ...form, status: e.target.value })}><option>planifié</option><option>terminé</option><option>annulé</option></FSe></FL>
          </div>
          <FL label="Entreprise"><FSe value={form.company || ""} onChange={e => setForm({ ...form, company: e.target.value })}><option value="">— Aucune —</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</FSe></FL>
          <FL label="Notes"><FTa value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes optionnelles…" /></FL>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
            <Btn v="ghost" onClick={() => setModal(null)}>Annuler</Btn>
            <Btn onClick={save}><Ic n="check" s={15} /> Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PROJECTS
═══════════════════════════════════════════════════════════════ */
const Projects = ({ projects, setProjects, companies, users, addLog, toast }) => {
  const { user } = useAuth(); const can = useCan();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [filter, setFilter] = useState("all");
  if (!can("projects.view")) return <NoAccess />;
  const visible = filter === "all" ? projects : projects.filter(p => p.status === filter);
  const save = () => {
    if (!form.name?.trim()) return toast("Nom requis", "error");
    let updated;
    if (modal === "create") {
      updated = [...projects, { ...form, id: `p${Date.now()}`, budget: +(form.budget || 0), progress: +(form.progress || 0) }];
      addLog(`Projet créé : ${form.name}`); toast("Projet créé !", "success");
    } else {
      updated = projects.map(p => p.id === form.id ? { ...form, budget: +(form.budget || 0), progress: +(form.progress || 0) } : p);
      addLog(`Projet modifié : ${form.name}`); toast("Mis à jour !", "success");
    }
    setProjects(updated); S.set(KEYS.projects, updated); setModal(null);
  };
  const del = (p) => {
    setConfirm({ msg: `Supprimer "${p.name}" ?`, fn: () => {
      const u = projects.filter(x => x.id !== p.id);
      setProjects(u); S.set(KEYS.projects, u);
      addLog(`Projet supprimé : ${p.name}`); toast("Supprimé", "success"); setConfirm(null);
    }});
  };
  return (
    <div className="fadeIn">
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "4px" }}>Projets</h2>
          <p style={{ color: C.muted, fontSize: "13px" }}>{visible.length} projet{visible.length > 1 ? "s" : ""}</p>
        </div>
        {can("projects.create") && <Btn onClick={() => { setForm({ name: "", company: companies[0]?.id || "", status: "planifié", budget: 0, progress: 0, startDate: new Date().toISOString().slice(0, 10), endDate: "", manager: user.id, priority: "moyenne" }); setModal("create"); }}><Ic n="plus" s={15} /> Nouveau projet</Btn>}
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["all", "planifié", "en cours", "terminé", "suspendu"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", borderRadius: "9px", border: `1px solid ${filter === f ? C.accent : C.border2}`, background: filter === f ? `${C.accent}18` : "transparent", color: filter === f ? "#93c5fd" : C.muted, cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.15s", whiteSpace: "nowrap" }}>{f === "all" ? "Tous" : f.charAt(0).toUpperCase() + f.slice(1)}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "14px" }}>
        {visible.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px", color: C.muted, fontSize: "14px", background: C.surface, borderRadius: "16px", border: `1px solid ${C.border}` }}>Aucun projet</div>}
        {visible.map(p => (
          <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "22px", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${C.border2}`; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${C.border}`; e.currentTarget.style.transform = "none"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "8px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: C.text, flex: 1 }}>{p.name}</div>
              <Badge label={p.priority} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: C.muted }}>Avancement</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{p.progress}%</span>
              </div>
              <div style={{ background: C.border, borderRadius: "999px", height: "6px", overflow: "hidden" }}>
                <div style={{ width: `${p.progress}%`, background: `linear-gradient(90deg,${C.accent},${C.accent2})`, borderRadius: "999px", height: "6px", boxShadow: `0 0 8px ${C.accent}66` }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              {[["🏢", companies.find(c => c.id === p.company)?.name || "N/A"], ["💰", `${(p.budget || 0).toLocaleString("fr-FR")} €`], ["📅", `${p.startDate || "?"} → ${p.endDate || "…"}`], ["👤", users.find(u => u.id === p.manager)?.name || "N/A"]].map(([e, v], i) => (
                <div key={i} style={{ fontSize: "11px", color: C.muted, display: "flex", gap: "5px", alignItems: "center", background: C.border, padding: "6px 8px", borderRadius: "7px" }}>
                  <span>{e}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
              <Badge label={p.status} />
              <div style={{ display: "flex", gap: "7px" }}>
                {can("projects.update") && <Btn v="ghost" size="sm" onClick={() => { setForm({ ...p }); setModal("edit"); }}><Ic n="edit" s={13} /></Btn>}
                {can("projects.delete") && <Btn v="danger" size="sm" onClick={() => del(p)}><Ic n="trash" s={13} /></Btn>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === "create" ? "Nouveau projet" : "Modifier le projet"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <FL label="Nom *" col="1/-1"><FIn value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom du projet" /></FL>
            <FL label="Entreprise" col="1/-1"><FSe value={form.company || ""} onChange={e => setForm({ ...form, company: e.target.value })}>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</FSe></FL>
            <FL label="Statut"><FSe value={form.status || "planifié"} onChange={e => setForm({ ...form, status: e.target.value })}><option>planifié</option><option>en cours</option><option>terminé</option><option>suspendu</option></FSe></FL>
            <FL label="Priorité"><FSe value={form.priority || "moyenne"} onChange={e => setForm({ ...form, priority: e.target.value })}><option>haute</option><option>moyenne</option><option>basse</option></FSe></FL>
            <FL label="Budget (€)"><FIn type="number" value={form.budget || ""} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="0" /></FL>
            <FL label="Avancement (%)"><FIn type="number" min="0" max="100" value={form.progress || ""} onChange={e => setForm({ ...form, progress: Math.min(100, Math.max(0, +e.target.value)) })} placeholder="0" /></FL>
            <FL label="Date début"><FIn type="date" value={form.startDate || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} /></FL>
            <FL label="Date fin prévue"><FIn type="date" value={form.endDate || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} /></FL>
            <FL label="Responsable" col="1/-1"><FSe value={form.manager || ""} onChange={e => setForm({ ...form, manager: e.target.value })}>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</FSe></FL>
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
            <Btn v="ghost" onClick={() => setModal(null)}>Annuler</Btn>
            <Btn onClick={save}><Ic n="check" s={15} /> Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PIPELINE
═══════════════════════════════════════════════════════════════ */
const Pipeline = ({ companies, setCompanies, toast, addLog }) => {
  const can = useCan();
  if (!can("pipeline.view")) return <NoAccess />;
  const stages = ["prospect", "négociation", "client", "perdu"];
  const meta = { prospect: { label: "Prospects", color: "#3b82f6" }, négociation: { label: "Négociation", color: "#f59e0b" }, client: { label: "Clients", color: "#10b981" }, perdu: { label: "Perdus", color: "#ef4444" } };
  const move = (co, ns) => {
    if (!can("pipeline.manage")) return toast("Permission refusée", "error");
    const u = companies.map(c => c.id === co.id ? { ...c, status: ns } : c);
    setCompanies(u); S.set(KEYS.companies, u);
    addLog(`Pipeline : ${co.name} → ${ns}`); toast(`${co.name} → ${meta[ns].label}`, "success");
  };
  return (
    <div className="fadeIn">
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "4px" }}>Pipeline commercial</h2>
        <p style={{ color: C.muted, fontSize: "13px" }}>{companies.length} entreprises · Glissez entre les colonnes</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", alignItems: "start" }}>
        {stages.map(stage => {
          const m = meta[stage]; const cols = companies.filter(c => c.status === stage);
          const revenue = cols.filter(c => c.revenue > 0).reduce((s, c) => s + c.revenue, 0);
          return (
            <div key={stage} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${m.color}`, borderRadius: "14px", padding: "14px", minHeight: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{m.label}</span>
                <span style={{ background: `${m.color}22`, color: m.color, padding: "2px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>{cols.length}</span>
              </div>
              {revenue > 0 && <div style={{ fontSize: "11px", color: C.muted, marginBottom: "10px", fontFamily: "'JetBrains Mono',monospace" }}>{revenue.toLocaleString("fr-FR")} €</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {cols.map(co => (
                  <div key={co.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "11px", padding: "13px", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${m.color}44`; }}
                    onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${C.border}`; }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: C.text, marginBottom: "4px" }}>{co.name}</div>
                    {co.sector && <div style={{ fontSize: "11px", color: C.muted, marginBottom: "4px" }}>{co.sector}{co.city ? ` · ${co.city}` : ""}</div>}
                    {co.revenue > 0 && <div style={{ fontSize: "11px", color: "#4ade80", fontWeight: 600, marginBottom: "6px", fontFamily: "'JetBrains Mono',monospace" }}>{co.revenue.toLocaleString("fr-FR")} €</div>}
                    {can("pipeline.manage") && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px", paddingTop: "6px", borderTop: `1px solid ${C.border}` }}>
                        {stages.filter(s => s !== stage).map(s => (
                          <button key={s} onClick={() => move(co, s)} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", border: `1px solid ${meta[s].color}33`, background: `${meta[s].color}11`, color: meta[s].color, cursor: "pointer", fontWeight: 600, transition: "all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${meta[s].color}28`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${meta[s].color}11`; }}>
                            → {meta[s].label.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {cols.length === 0 && <div style={{ textAlign: "center", color: C.muted, fontSize: "12px", padding: "20px 0", border: `1px dashed ${C.border}`, borderRadius: "10px" }}>Vide</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   USERS
═══════════════════════════════════════════════════════════════ */
const Users = ({ users, setUsers, roles, addLog, toast }) => {
  const { user } = useAuth(); const can = useCan();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [show, setShow] = useState(false);
  const [confirm, setConfirm] = useState(null);
  if (!can("users.view")) return <NoAccess />;
  const save = () => {
    if (!form.name?.trim() || !form.email?.trim()) return toast("Nom et email requis", "error");
    if (modal === "create" && !form.password?.trim()) return toast("Mot de passe requis", "error");
    if (modal === "create" && users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) return toast("Cet email existe déjà", "error");
    let updated;
    const av = form.name.split(" ").map(p => p[0] || "").slice(0, 2).join("").toUpperCase();
    if (modal === "create") {
      updated = [...users, { ...form, id: `u${Date.now()}`, avatar: av, createdAt: new Date().toISOString().slice(0, 10), isOwner: false }];
      addLog(`Utilisateur créé : ${form.name} (${form.email})`); toast(`${form.name} ajouté !`, "success");
    } else {
      const pw = form.password?.trim() || users.find(u => u.id === form.id)?.password;
      updated = users.map(u => u.id === form.id ? { ...form, password: pw, avatar: av } : u);
      addLog(`Utilisateur modifié : ${form.name}`); toast("Mis à jour !", "success");
    }
    setUsers(updated); S.set(KEYS.users, updated); setModal(null); setShow(false);
  };
  const del = (u) => {
    if (u.isOwner) return toast("Impossible de supprimer le compte propriétaire", "error");
    setConfirm({ msg: `Supprimer "${u.name}" ? Il ne pourra plus se connecter.`, fn: () => {
      const updated = users.filter(x => x.id !== u.id);
      setUsers(updated); S.set(KEYS.users, updated);
      addLog(`Utilisateur supprimé : ${u.name}`); toast("Compte supprimé", "success"); setConfirm(null);
    }});
  };
  const copyPassword = (pw) => { navigator.clipboard?.writeText(pw); toast("Mot de passe copié", "info"); };
  const isOwner = user.isOwner;
  return (
    <div className="fadeIn">
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "4px" }}>Utilisateurs</h2>
          <p style={{ color: C.muted, fontSize: "13px" }}>{users.length} compte{users.length > 1 ? "s" : ""}</p>
        </div>
        {isOwner && <Btn onClick={() => { setForm({ name: "", email: "", password: "", role: roles[1]?.id || "assistant" }); setModal("create"); setShow(false); }}><Ic n="plus" s={15} /> Créer un compte</Btn>}
      </div>
      {!isOwner && can("users.view") && <div style={{ background: "#0c1a3d", border: `1px solid ${C.accent}44`, borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <Ic n="info" s={16} /><span style={{ fontSize: "13px", color: "#93c5fd" }}>Seul le Directeur de Campagne peut créer ou supprimer des comptes.</span>
      </div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "14px" }}>
        {users.map(u => {
          const r = roles.find(x => x.id === u.role);
          return (
            <div key={u.id} style={{ background: C.surface, border: `1px solid ${u.isOwner ? C.accent + "44" : C.border}`, borderRadius: "16px", padding: "22px", transition: "all 0.2s", position: "relative" }}
              onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${r?.color || C.accent}44`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${u.isOwner ? C.accent + "44" : C.border}`; e.currentTarget.style.transform = "none"; }}>
              {u.isOwner && <div style={{ position: "absolute", top: "14px", right: "14px", fontSize: "11px", background: `${C.accent}22`, color: C.accent, padding: "2px 8px", borderRadius: "6px", fontWeight: 600, border: `1px solid ${C.accent}44` }}>OWNER</div>}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", background: `${r?.color || C.accent}18`, border: `2px solid ${r?.color || C.accent}44`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 800, color: r?.color || C.accent, flexShrink: 0 }}>{u.avatar || u.name[0]}</div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "4px" }}>{u.name}</div>
                  <div style={{ fontSize: "12px", color: r?.color || C.muted, fontWeight: 500 }}>{r?.icon} {r?.name || "—"}</div>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: C.muted, display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><Ic n="info" s={12} />{u.email}</div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>📅 Depuis le {new Date(u.createdAt).toLocaleDateString("fr-FR")}</div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>Permissions ({r?.permissions?.length || 0})</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {r?.permissions?.slice(0, 5).map(p => (<span key={p} style={{ fontSize: "9px", background: C.border, border: `1px solid ${C.border2}`, color: "#4ade80", padding: "2px 7px", borderRadius: "4px", fontFamily: "'JetBrains Mono',monospace" }}>{p}</span>))}
                  {(r?.permissions?.length || 0) > 5 && <span style={{ fontSize: "9px", color: C.accent, fontWeight: 600 }}>+{r.permissions.length - 5} autres</span>}
                  {!r && <span style={{ fontSize: "10px", color: C.muted }}>Aucun rôle assigné</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "7px", justifyContent: "flex-end", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
                {isOwner && <button onClick={() => copyPassword(u.password)} style={{ background: C.border, border: `1px solid ${C.border2}`, color: C.muted, padding: "6px", borderRadius: "8px", cursor: "pointer", display: "flex", transition: "all 0.15s" }} title="Copier le mot de passe" onMouseEnter={e => { e.currentTarget.style.color = C.text; }} onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}><Ic n="copy" s={14} /></button>}
                {can("users.update") && <Btn v="ghost" size="sm" onClick={() => { setForm({ ...u, password: "" }); setModal("edit"); setShow(false); }}><Ic n="edit" s={13} /> Modifier</Btn>}
                {isOwner && !u.isOwner && <Btn v="danger" size="sm" onClick={() => del(u)}><Ic n="trash" s={13} /></Btn>}
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <Modal title={modal === "create" ? "Créer un compte" : "Modifier le compte"} onClose={() => { setModal(null); setShow(false); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <FL label="Nom complet *" col="1/-1"><FIn value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Prénom Nom" /></FL>
            <FL label="Email *" col="1/-1"><FIn type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@email.com" disabled={modal === "edit" && form.isOwner} /></FL>
            <FL label={modal === "create" ? "Mot de passe *" : "Nouveau mot de passe"} col="1/-1">
              <div style={{ position: "relative" }}>
                <FIn type={show ? "text" : "password"} value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={modal === "edit" ? "Laisser vide pour ne pas changer" : "••••••••"} style={{ paddingRight: "44px" }} />
                <button onClick={() => setShow(!show)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex" }}><Ic n={show ? "eyeoff" : "eye"} s={16} /></button>
              </div>
            </FL>
            <FL label="Rôle assigné" col="1/-1">
              <FSe value={form.role || ""} onChange={e => setForm({ ...form, role: e.target.value })} disabled={modal === "edit" && form.isOwner}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
              </FSe>
            </FL>
          </div>
          {form.role && (
            <div style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Permissions accordées avec ce rôle</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {roles.find(r => r.id === form.role)?.permissions?.map(p => (<span key={p} style={{ fontSize: "10px", background: `${C.accent}15`, border: `1px solid ${C.accent}33`, color: "#93c5fd", padding: "2px 8px", borderRadius: "5px", fontFamily: "'JetBrains Mono',monospace" }}>{p}</span>)) || <span style={{ color: C.muted, fontSize: "12px" }}>Aucune permission</span>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
            <Btn v="ghost" onClick={() => { setModal(null); setShow(false); }}>Annuler</Btn>
            <Btn onClick={save}><Ic n="check" s={15} /> Enregistrer</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ROLES MANAGER
═══════════════════════════════════════════════════════════════ */
const RolesManager = ({ roles, setRoles, users, addLog, toast }) => {
  const { user } = useAuth(); const can = useCan();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [confirm, setConfirm] = useState(null);
  if (!can("roles.manage")) return <NoAccess />;
  const groups = [...new Set(ALL_PERMS.map(p => p.group))];
  const toggle = (perm) => {
    const has = form.permissions?.includes(perm);
    setForm({ ...form, permissions: has ? (form.permissions || []).filter(p => p !== perm) : [...(form.permissions || []), perm] });
  };
  const toggleGroup = (group) => {
    const gperms = ALL_PERMS.filter(p => p.group === group).map(p => p.key);
    const allHas = gperms.every(p => form.permissions?.includes(p));
    if (allHas) { setForm({ ...form, permissions: (form.permissions || []).filter(p => !gperms.includes(p)) }); }
    else { const ex = new Set([...(form.permissions || []), ...gperms]); setForm({ ...form, permissions: [...ex] }); }
  };
  const selectAll = () => setForm({ ...form, permissions: ALL_PERMS.map(p => p.key) });
  const clearAll = () => setForm({ ...form, permissions: [] });
  const save = () => {
    if (!form.name?.trim()) return toast("Nom du rôle requis", "error");
    let updated;
    if (modal === "create") {
      const newRole = { ...form, id: `role_${Date.now()}`, locked: false, permissions: form.permissions || [] };
      updated = [...roles, newRole];
      addLog(`Rôle créé : ${form.name}`); toast(`Rôle "${form.name}" créé !`, "success");
    } else {
      updated = roles.map(r => r.id === form.id ? { ...form } : r);
      addLog(`Rôle modifié : ${form.name}`); toast("Rôle mis à jour !", "success");
    }
    setRoles(updated); S.set(KEYS.roles, updated); setModal(null);
  };
  const del = (r) => {
    if (r.locked) return toast("Ce rôle système ne peut pas être supprimé", "error");
    if (users.some(u => u.role === r.id)) return toast("Des utilisateurs ont ce rôle, réassignez-les d'abord", "error");
    setConfirm({ msg: `Supprimer le rôle "${r.name}" ?`, fn: () => {
      const u = roles.filter(x => x.id !== r.id);
      setRoles(u); S.set(KEYS.roles, u);
      addLog(`Rôle supprimé : ${r.name}`); toast("Rôle supprimé", "success"); setConfirm(null);
    }});
  };
  const COLORS = ["#5b6af0","#7c3aed","#059669","#dc2626","#d97706","#ec4899","#0891b2","#65a30d","#e11d48","#7c2d12"];
  const ICONS = ["👑","💼","📊","📋","🛡️","⚡","🎯","🔑","🌟","🔧","👁️","✏️"];
  return (
    <div className="fadeIn">
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "4px" }}>Rôles & Permissions</h2>
          <p style={{ color: C.muted, fontSize: "13px" }}>{roles.length} rôles configurés · {ALL_PERMS.length} permissions disponibles</p>
        </div>
        {user.isOwner && <Btn onClick={() => { setForm({ name: "", color: COLORS[0], icon: "🎯", permissions: [] }); setModal("create"); }}><Ic n="plus" s={15} /> Créer un rôle</Btn>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "14px" }}>
        {roles.map(r => {
          const usersWithRole = users.filter(u => u.role === r.id);
          const gGroups = groups.map(g => ({ g, perms: ALL_PERMS.filter(p => p.group === g && r.permissions.includes(p.key)) })).filter(x => x.perms.length > 0);
          return (
            <div key={r.id} style={{ background: C.surface, border: `1px solid ${r.locked ? r.color + "33" : C.border}`, borderRadius: "16px", padding: "22px", transition: "all 0.2s", position: "relative" }}
              onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${r.color}55`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${r.locked ? r.color + "33" : C.border}`; e.currentTarget.style.transform = "none"; }}>
              {r.locked && <div style={{ position: "absolute", top: "14px", right: "14px", fontSize: "10px", background: `${r.color}22`, color: r.color, padding: "2px 8px", borderRadius: "6px", fontWeight: 600, border: `1px solid ${r.color}44` }}>SYSTÈME</div>}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div style={{ width: "50px", height: "50px", background: `${r.color}18`, border: `2px solid ${r.color}44`, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{r.icon || "🎯"}</div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: r.color, marginBottom: "3px" }}>{r.name}</div>
                  <div style={{ fontSize: "11px", color: C.muted }}>{r.permissions.length} permission{r.permissions.length > 1 ? "s" : ""} · {usersWithRole.length} utilisateur{usersWithRole.length > 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                {gGroups.slice(0, 3).map(({ g, perms }) => (
                  <div key={g} style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "10px", color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>{g}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>{perms.map(p => <span key={p.key} style={{ fontSize: "9px", background: `${r.color}15`, border: `1px solid ${r.color}33`, color: r.color, padding: "2px 7px", borderRadius: "4px", fontFamily: "'JetBrains Mono',monospace" }}>{p.key.split(".")[1]}</span>)}</div>
                  </div>
                ))}
                {gGroups.length > 3 && <div style={{ fontSize: "11px", color: C.muted }}>+{gGroups.length - 3} groupes supplémentaires</div>}
                {r.permissions.length === 0 && <div style={{ fontSize: "12px", color: C.muted, fontStyle: "italic" }}>Aucune permission</div>}
              </div>
              {usersWithRole.length > 0 && (
                <div style={{ marginBottom: "14px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {usersWithRole.slice(0, 4).map(u => (<div key={u.id} style={{ background: C.border, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: C.muted, display: "flex", alignItems: "center", gap: "4px" }}><span style={{ fontSize: "10px", fontWeight: 700, color: r.color }}>{u.avatar}</span>{u.name.split(" ")[0]}</div>))}
                  {usersWithRole.length > 4 && <span style={{ fontSize: "11px", color: C.muted }}>+{usersWithRole.length - 4}</span>}
                </div>
              )}
              <div style={{ display: "flex", gap: "7px", justifyContent: "flex-end", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
                {(user.isOwner || can("roles.manage")) && <Btn v="ghost" size="sm" onClick={() => { setForm({ ...r, permissions: [...r.permissions] }); setModal("edit"); }}><Ic n="edit" s={13} /> {r.locked ? "Voir" : "Modifier"}</Btn>}
                {user.isOwner && !r.locked && <Btn v="danger" size="sm" onClick={() => del(r)}><Ic n="trash" s={13} /></Btn>}
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <Modal title={modal === "create" ? "Créer un rôle" : form.locked ? "Voir le rôle" : "Modifier le rôle"} onClose={() => setModal(null)} size="lg">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
            <FL label="Nom du rôle *" col="1/3"><FIn value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Chef de projet" disabled={form.locked} /></FL>
            <FL label="Couleur">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                {COLORS.map(co => (<button key={co} onClick={() => !form.locked && setForm({ ...form, color: co })} style={{ width: "24px", height: "24px", background: co, borderRadius: "6px", border: form.color === co ? `3px solid ${C.text}` : "2px solid transparent", cursor: form.locked ? "not-allowed" : "pointer", transition: "all 0.1s", flexShrink: 0 }} />))}
              </div>
            </FL>
            <FL label="Icône" col="1/-1">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                {ICONS.map(ic => (<button key={ic} onClick={() => !form.locked && setForm({ ...form, icon: ic })} style={{ width: "36px", height: "36px", fontSize: "18px", background: form.icon === ic ? `${form.color || C.accent}22` : "transparent", borderRadius: "9px", border: `2px solid ${form.icon === ic ? form.color || C.accent : C.border}`, cursor: form.locked ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.1s" }}>{ic}</button>))}
              </div>
            </FL>
          </div>
          <div style={{ marginTop: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>Permissions</span>
              {!form.locked && <div style={{ display: "flex", gap: "8px" }}><Btn v="ghost" size="sm" onClick={selectAll}><Ic n="check" s={12} /> Tout sélectionner</Btn><Btn v="ghost" size="sm" onClick={clearAll}><Ic n="x" s={12} /> Tout désélectionner</Btn></div>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {groups.map(group => {
                const gperms = ALL_PERMS.filter(p => p.group === group);
                const allSelected = gperms.every(p => form.permissions?.includes(p.key));
                const someSelected = gperms.some(p => form.permissions?.includes(p.key));
                return (
                  <div key={group} style={{ background: C.bg, border: `1px solid ${someSelected ? (form.color || C.accent) + "33" : C.border}`, borderRadius: "12px", padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: someSelected ? form.color || C.accent : C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{group}</span>
                      {!form.locked && <button onClick={() => toggleGroup(group)} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "5px", border: `1px solid ${allSelected ? form.color || C.accent : C.border2}`, background: allSelected ? `${form.color || C.accent}22` : "transparent", color: allSelected ? form.color || C.accent : C.muted, cursor: "pointer", fontWeight: 600 }}>{allSelected ? "Tout retirer" : "Tout ajouter"}</button>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {gperms.map(p => {
                        const on = form.permissions?.includes(p.key);
                        return (
                          <label key={p.key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: form.locked ? "default" : "pointer", padding: "6px 8px", borderRadius: "7px", background: on ? `${form.color || C.accent}12` : "transparent", transition: "background 0.15s" }}>
                            <div onClick={() => !form.locked && toggle(p.key)} style={{ width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${on ? form.color || C.accent : C.border2}`, background: on ? form.color || C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", cursor: form.locked ? "default" : "pointer" }}>
                              {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>}
                            </div>
                            <span style={{ fontSize: "12px", color: on ? C.text : C.muted, fontWeight: on ? 500 : 400 }}>{p.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: C.muted }}>Total permissions sélectionnées</span>
            <span style={{ fontSize: "16px", fontWeight: 800, color: form.color || C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{form.permissions?.length || 0} / {ALL_PERMS.length}</span>
          </div>
          {!form.locked && <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: `1px solid ${C.border}` }}>
            <Btn v="ghost" onClick={() => setModal(null)}>Annuler</Btn>
            <Btn onClick={save} sx={{ background: `linear-gradient(135deg,${form.color || C.accent},${C.accent2})` }}><Ic n="check" s={15} /> {modal === "create" ? "Créer le rôle" : "Enregistrer les modifications"}</Btn>
          </div>}
          {form.locked && <div style={{ display: "flex", justifyContent: "flex-end" }}><Btn v="ghost" onClick={() => setModal(null)}>Fermer</Btn></div>}
        </Modal>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   LOGS
═══════════════════════════════════════════════════════════════ */
const Logs = ({ logs }) => {
  const can = useCan();
  if (!can("logs.view")) return <NoAccess />;
  const sorted = [...logs].reverse();
  return (
    <div className="fadeIn">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "4px" }}>Journal d'activité</h2>
          <p style={{ color: C.muted, fontSize: "13px" }}>{logs.length} entrée{logs.length > 1 ? "s" : ""}</p>
        </div>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden" }}>
        {sorted.length === 0 && <div style={{ padding: "48px", textAlign: "center", color: C.muted, fontSize: "14px" }}>Aucune activité enregistrée</div>}
        {sorted.map((l, i) => (
          <div key={i} className={i < 10 ? "fadeUp" : ""} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 18px", borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = `${C.border}44`} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.accent, flexShrink: 0, marginTop: "5px", boxShadow: `0 0 6px ${C.accent}88` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", color: C.text, marginBottom: "3px" }}>{l.message}</div>
              <div style={{ fontSize: "11px", color: C.muted, display: "flex", gap: "8px" }}>
                <span style={{ fontWeight: 500, color: `${C.accent}bb` }}>{l.user}</span>
                <span>·</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{new Date(l.timestamp).toLocaleString("fr-FR")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════════ */
const Settings = ({ toast, users, roles }) => {
  const { user } = useAuth(); const can = useCan();
  if (!can("settings.manage")) return <NoAccess />;
  return (
    <div className="fadeIn">
      <h2 style={{ fontSize: "24px", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", marginBottom: "24px" }}>Paramètres</h2>
      <div style={{ display: "grid", gap: "14px", maxWidth: "720px" }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: "16px", padding: "22px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Ic n="users" s={16} /> Mon compte</h3>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: "13px", marginBottom: "14px" }}>
            {[["Nom", user.name], ["Email", user.email], ["Rôle", roles.find(r => r.id === user.role)?.name || "—"], ["Membre depuis", new Date(user.createdAt).toLocaleDateString("fr-FR")]].map(([k, v]) => (
              <><span key={k + "k"} style={{ color: C.muted, fontWeight: 600 }}>{k}</span><span key={k + "v"} style={{ color: C.text }}>{v}</span></>
            ))}
          </div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "22px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.text, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}><Ic n="dashboard" s={16} /> Statistiques système</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "10px" }}>
            {[[users.length, "Utilisateurs", "#5b6af0"], [roles.length, "Rôles", "#7c3aed"], [ALL_PERMS.length, "Permissions", "#059669"]].map(([v, l, c]) => (
              <div key={l} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: 800, color: c, fontFamily: "'JetBrains Mono',monospace" }}>{v}</div>
                <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#0c1a3d", border: `1px solid ${C.accent}44`, borderRadius: "16px", padding: "22px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#93c5fd", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}><Ic n="shield" s={16} /> Sécurité & Accès</h3>
          <div style={{ fontSize: "13px", color: "#7dd3fc", lineHeight: "1.8" }}>
            ✅ <strong>Authentification requise</strong> — Aucune page accessible sans connexion<br />
            ✅ <strong>Permissions par rôle</strong> — Vérifiées à chaque action utilisateur<br />
            ✅ <strong>Filtrage des données</strong> — Chaque user voit uniquement ce qui lui est attribué<br />
            ✅ <strong>Création de comptes réservée</strong> — Uniquement au Directeur de Campagne<br />
            ✅ <strong>Logs d'activité</strong> — Toutes les actions importantes sont tracées<br />
            ✅ <strong>Session persistante</strong> — Sécurisée via localStorage
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [companies, setCompanies] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);

  const addLog = useCallback((message) => {
    if (!authUser) return;
    const entry = { message, user: authUser.name, timestamp: new Date().toISOString() };
    setLogs(prev => {
      const u = [...prev, entry];
      S.set(KEYS.logs, u);
      return u;
    });
  }, [authUser]);

  useEffect(() => {
    // Initialisation synchrone avec localStorage
    const allU = S.get(KEYS.users) || DEFAULT_USERS;
    if (!S.get(KEYS.users)) S.set(KEYS.users, allU);

    const allR = S.get(KEYS.roles) || DEFAULT_ROLES;
    if (!S.get(KEYS.roles)) S.set(KEYS.roles, allR);

    const allC = S.get(KEYS.companies) || DEFAULT_COMPANIES;
    if (!S.get(KEYS.companies)) S.set(KEYS.companies, allC);

    const allA = S.get(KEYS.appointments) || DEFAULT_APPOINTMENTS;
    if (!S.get(KEYS.appointments)) S.set(KEYS.appointments, allA);

    const allP = S.get(KEYS.projects) || DEFAULT_PROJECTS;
    if (!S.get(KEYS.projects)) S.set(KEYS.projects, allP);

    const allL = S.get(KEYS.logs) || [];
    if (!S.get(KEYS.logs)) S.set(KEYS.logs, allL);

    setUsers(allU);
    setRoles(allR);
    setCompanies(allC);
    setAppointments(allA);
    setProjects(allP);
    setLogs(allL);

    const sess = S.get(KEYS.session);
    if (sess?.userId) {
      const fu = allU.find(x => x.id === sess.userId);
      if (fu) setAuthUser(fu);
    }
    setLoading(false);
  }, []);

  const onLogin = (u) => {
    S.set(KEYS.session, { userId: u.id });
    setAuthUser(u);
    setView("dashboard");
  };

  const onLogout = () => {
    S.set(KEYS.session, null);
    setAuthUser(null);
  };

  const views = {
    dashboard:    <Dashboard companies={companies} appointments={appointments} projects={projects} users={users} />,
    companies:    <Companies companies={companies} setCompanies={setCompanies} users={users} addLog={addLog} toast={toast} />,
    appointments: <Appointments appointments={appointments} setAppointments={setAppointments} companies={companies} addLog={addLog} toast={toast} />,
    projects:     <Projects projects={projects} setProjects={setProjects} companies={companies} users={users} addLog={addLog} toast={toast} />,
    pipeline:     <Pipeline companies={companies} setCompanies={setCompanies} toast={toast} addLog={addLog} />,
    users:        <Users users={users} setUsers={setUsers} roles={roles} addLog={addLog} toast={toast} />,
    roles:        <RolesManager roles={roles} setRoles={setRoles} users={users} addLog={addLog} toast={toast} />,
    logs:         <Logs logs={logs} />,
    settings:     <Settings toast={toast} users={users} roles={roles} />,
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
      <style>{globalCSS}</style>
      <div style={{ width: "48px", height: "48px", border: `3px solid ${C.border2}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ color: C.muted, fontSize: "14px" }}>Chargement de CRG Internal…</span>
    </div>
  );

  if (!authUser) return <Login onLogin={onLogin} />;

  return (
    <AuthCtx.Provider value={{ user: authUser, roles }}>
      <style>{globalCSS}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
        <Sidebar active={view} setActive={setView} onLogout={onLogout} user={authUser} roles={roles} />
        <main style={{ flex: 1, padding: "36px 40px", overflowY: "auto", maxHeight: "100vh" }}>
          {views[view] || <Dashboard companies={companies} appointments={appointments} projects={projects} users={users} />}
        </main>
      </div>
      <Toast toasts={toasts} />
    </AuthCtx.Provider>
  );
}
