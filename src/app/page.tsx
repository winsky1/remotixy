"use client";

import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clipboard, Eye, Files, Hand, KeyRound, LifeBuoy, Lock, MessageSquare, MonitorSmartphone, MonitorUp, MousePointer2, PhoneOff, Printer, RadioTower, ShieldCheck, Sparkles, Users } from "lucide-react";

type Mode = "idle" | "host" | "guest";
type View = "home" | "login" | "signup" | "dashboard";
type PointerEvent = { x: number; y: number; label: string };

const safetyItems = [
  "The person sharing their screen must start the session themselves.",
  "The browser shows a native permission prompt before sharing begins.",
  "A visible session banner and stop button remain on screen.",
  "This demo does not install agents, hide windows, persist access, or bypass OS permissions."
];

const productPillars = [
  {
    icon: MonitorSmartphone,
    title: "Remote access",
    text: "Connect from any browser with short-lived, visible support sessions.",
    features: ["Mobile-ready viewer", "Multi-monitor friendly", "Copy invite flow"]
  },
  {
    icon: LifeBuoy,
    title: "Technical support",
    text: "Assist users who explicitly request help without hidden background access.",
    features: ["Instant session code", "Visible screen sharing", "Pointer requests"]
  },
  {
    icon: MessageSquare,
    title: "Collaborate",
    text: "Built for guided troubleshooting, demos, and secure support workflows.",
    features: ["Session notes ready", "Audit-first posture", "No-install browser flow"]
  }
];

const suiteFeatures = [
  { icon: Files, title: "Approved file transfer", text: "Prepare files for user-approved exchange during a support session." },
  { icon: Printer, title: "Remote printing workflow", text: "Queue print requests with explicit confirmation before action." },
  { icon: ShieldCheck, title: "Security controls", text: "Short-lived codes, consent prompts, visible banners, and safe boundaries." },
  { icon: RadioTower, title: "Connectivity ready", text: "Designed for WebRTC signaling, TURN fallback, and low-bandwidth networks." }
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    description: "For solo technicians and very small teams.",
    devices: "Up to 4 devices",
    highlight: true,
    features: ["Instant support sessions", "Browser screen sharing", "Session invite links", "Basic safety controls"]
  },
  {
    name: "Starter",
    price: "$12",
    description: "For growing support desks.",
    devices: "Up to 25 devices",
    highlight: false,
    features: ["Everything in Free", "Device inventory", "Usage reporting", "Email support"]
  },
  {
    name: "Team",
    price: "$29",
    description: "For multi-operator IT teams.",
    devices: "Up to 100 devices",
    highlight: false,
    features: ["Everything in Starter", "Operator roles", "Audit history", "Priority support"]
  },
  {
    name: "Business",
    price: "Custom",
    description: "For larger organizations and managed service providers.",
    devices: "Unlimited packages",
    highlight: false,
    features: ["Custom device bundles", "SSO-ready roadmap", "Policy controls", "Dedicated onboarding"]
  }
];

const managedDevices = [
  { name: "Finance-Laptop-01", group: "Finance", os: "Windows 11", status: "Online", health: "Healthy", alerts: 0, lastSeen: "Now", version: "1.0.4" },
  { name: "Reception-PC-02", group: "Front Office", os: "Windows 10", status: "Online", health: "Needs attention", alerts: 2, lastSeen: "3 min ago", version: "1.0.3" },
  { name: "Ops-MacBook-03", group: "Operations", os: "macOS", status: "Idle", health: "Healthy", alerts: 0, lastSeen: "18 min ago", version: "1.0.4" },
  { name: "New host computer", group: "Unassigned", os: "Pending", status: "Waiting", health: "Pending install", alerts: 0, lastSeen: "Host link not opened", version: "â€”" }
];

const deviceActions = ["Remote support", "Start screen share", "Diagnostics", "Rename", "Move group", "Remove"];

function createSessionCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 9 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("").replace(/(...)(...)(...)/, "$1-$2-$3");
}

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [mode, setMode] = useState<Mode>("idle");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [technicianName, setTechnicianName] = useState("Support Technician");
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("Ask Gemini for troubleshooting steps, device triage, or customer support wording.");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [guestCode, setGuestCode] = useState("");
  const [status, setStatus] = useState("Ready to start a secure support session.");
  const [isSharing, setIsSharing] = useState(false);
  const [pointer, setPointer] = useState<PointerEvent | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const shareUrl = useMemo(() => {
    if (!sessionCode || typeof window === "undefined") return "";
    return `${window.location.origin}/?session=${encodeURIComponent(sessionCode)}`;
  }, [sessionCode]);
  const supportClientLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    const technician = encodeURIComponent(email || "technician@remotixy.local");
    return `${window.location.origin}/?technician=${technician}&install=support-client`;
  }, [email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("session");
    if (code) {
      setGuestCode(code);
      setMode("guest");
      setStatus("Session code loaded. Ask the host to confirm your identity before sharing.");
    }
    const technician = params.get("technician");
    const install = params.get("install");
    if (technician && install === "support-client") {
      setMode("host");
      setStatus(`Support client link opened for ${technician}. The host computer can start a visible support session and appear in the technician dashboard.`);
    }
  }, []);

  useEffect(() => {
    return () => stopSharing();
  }, []);

  async function startHosting() {
    if (!consentAccepted) {
      setStatus("Review and accept the safety checklist before starting.");
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setStatus("Screen sharing is not supported by this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setSessionCode(createSessionCode());
      setMode("host");
      setIsSharing(true);
      setStatus("Screen sharing is active. You can stop sharing at any time.");
      stream.getVideoTracks()[0]?.addEventListener("ended", stopSharing);
    } catch {
      setStatus("Screen sharing was cancelled or blocked by the browser.");
    }
  }

  function joinSession() {
    const normalized = guestCode.trim().toUpperCase();
    if (normalized.length < 6) {
      setStatus("Enter the session code provided by the host.");
      return;
    }
    setMode("guest");
    setGuestCode(normalized);
    setStatus("Guest mode ready. In production, this connects through a WebRTC signaling server.");
  }

  function stopSharing() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsSharing(false);
    setPointer(null);
  }

  function endSession() {
    stopSharing();
    setMode("idle");
    setSessionCode("");
    setGuestCode("");
    setStatus("Session ended. No connection remains active.");
  }

  async function copyInvite() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setStatus("Invite link copied to clipboard.");
  }

  async function copySupportClientLink() {
    if (!supportClientLink) return;
    await navigator.clipboard.writeText(supportClientLink);
    setStatus("Support client link copied. Send it to the host computer so they can download/start the client.");
  }

  function handleGuestCode(event: ChangeEvent<HTMLInputElement>) {
    setGuestCode(event.target.value.toUpperCase());
  }

  function openSignup(plan = "Free") {
    setView("signup");
    setStatus(`${plan} package selected. Create an account to continue.`);
  }

  function submitAuth(nextView: View) {
    if (!email.trim()) {
      setStatus("Enter your email address to continue.");
      return;
    }
    setView(nextView);
    setStatus("Signed in to the Remotixy web console.");
  }

  async function askAssistant() {
    if (!assistantPrompt.trim()) {
      setStatus("Enter a technician assistant question first.");
      return;
    }
    setAssistantLoading(true);
    setStatus("Google AI assistant is preparing a response.");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: assistantPrompt })
      });
      const data = await response.json();
      setAssistantAnswer(data.answer ?? data.error ?? "No assistant response returned.");
      setStatus(response.ok ? "Google AI assistant response ready." : "Google AI assistant needs configuration.");
    } catch {
      setAssistantAnswer("Unable to reach the Google AI assistant route.");
      setStatus("Assistant request failed.");
    } finally {
      setAssistantLoading(false);
    }
  }

  function placePointer(event: MouseEvent<HTMLDivElement>) {
    if (mode !== "guest") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
      label: "Guest requested attention here"
    });
    setStatus("Pointer request sent. The host must take the action themselves.");
  }

  return (
    <main className="min-h-screen px-5 py-6 text-slate-900 md:px-10 lg:px-16">
      <section className="mx-auto grid max-w-7xl gap-8">
        <header className="sticky top-4 z-30 flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white/95 p-4 shadow-card backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-assist text-white shadow-glow">
              <LifeBuoy className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-assist">Remotixy Remote</p>
              <h1 className="text-2xl font-black tracking-tight">Access, support, and collaborate</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setView("home")} className="rounded-xl px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100">Home</button>
            <a href="#packages" className="rounded-xl px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100">Pricing</a>
            <button onClick={() => setView("dashboard")} className="rounded-xl px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100">Console</button>
            <button onClick={() => setView("login")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-900 hover:bg-slate-50">Login</button>
            <button onClick={() => openSignup()} className="rounded-xl bg-assist px-4 py-2 text-sm font-black text-white shadow-glow hover:brightness-110">Sign up free</button>
          </div>
        </header>

        {view === "login" && (
          <section className="mx-auto grid w-full max-w-xl gap-5 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-card">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-assist">Login</p>
              <h2 className="mt-2 text-4xl font-black text-slate-950">Access your web console.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Technicians sign in to manage billing, devices, support links, sessions, and operators. Host computers do not need accounts.</p>
            </div>
            <div className="grid gap-3">
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-assist/20 focus:ring-4" />
              <input placeholder="Password" type="password" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-assist/20 focus:ring-4" />
              <button onClick={() => submitAuth("dashboard")} className="rounded-2xl bg-assist px-5 py-3 font-black text-white shadow-glow">Login</button>
            </div>
            <button onClick={() => setView("signup")} className="text-sm font-black text-assist">Need an account? Sign up free.</button>
          </section>
        )}

        {view === "signup" && (
          <section className="mx-auto grid w-full max-w-2xl gap-5 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-card">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-assist">Sign up</p>
              <h2 className="mt-2 text-4xl font-black text-slate-950">Create your free account.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Create a technician account, choose a package, then send host computers a support-client link. Hosts do not log in.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-assist/20 focus:ring-4" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Work email" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-assist/20 focus:ring-4" />
              <input value={technicianName} onChange={(event) => setTechnicianName(event.target.value)} placeholder="Technician name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-assist/20 focus:ring-4 md:col-span-2" />
              <input placeholder="Password" type="password" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-assist/20 focus:ring-4 md:col-span-2" />
              <button onClick={() => submitAuth("dashboard")} className="rounded-2xl bg-assist px-5 py-3 font-black text-white shadow-glow md:col-span-2">Create free account</button>
            </div>
            <button onClick={() => setView("login")} className="text-sm font-black text-assist">Already have an account? Login.</button>
          </section>
        )}

        {view === "dashboard" && (
          <section className="grid gap-6 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-card lg:grid-cols-[280px_1fr]">
            <aside className="rounded-[2rem] bg-slate-950 p-5 text-white">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-assist">Web console</p>
              <h2 className="mt-3 text-2xl font-black">{company || "Your workspace"}</h2>
              <div className="mt-6 grid gap-2 text-sm font-bold">
                {["Computers", "Remote Support", "Operators", "Usage Reports", "Billing"].map((item) => (
                  <div key={item} className="rounded-xl bg-white/10 px-4 py-3">{item}</div>
                ))}
              </div>
            </aside>
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-4">
                {["4 device free limit", "0 active sessions", "1 operator", "Free plan"].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 font-black text-slate-950">{item}</div>
                ))}
              </div>
              <div className="rounded-[2rem] border border-assist/20 bg-assist/5 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-assist">Host computer link</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">Send this to the customer computer</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">The host opens this link, downloads or starts the support client, grants visible permission, and then the computer appears in this technician dashboard.</p>
                  </div>
                  <button onClick={copySupportClientLink} className="rounded-2xl bg-assist px-5 py-3 font-black text-white shadow-glow">Copy host link</button>
                </div>
                <div className="mt-4 break-all rounded-2xl bg-white p-4 font-mono text-sm text-slate-700">{supportClientLink}</div>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-assist">Google AI assistance</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-950">Technician troubleshooting assistant</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Powered by Gemini when `GOOGLE_AI_API_KEY` is configured on the server.</p>
                  </div>
                  <Sparkles className="h-9 w-9 shrink-0 text-assist" />
                </div>
                <div className="mt-5 grid gap-3">
                  <textarea value={assistantPrompt} onChange={(event) => setAssistantPrompt(event.target.value)} placeholder="Example: Reception-PC-02 is online but has two alerts. Give me safe troubleshooting steps." className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-assist/20 focus:ring-4" />
                  <button onClick={askAssistant} disabled={assistantLoading} className="w-fit rounded-2xl bg-assist px-5 py-3 font-black text-white shadow-glow disabled:opacity-60">{assistantLoading ? "Asking Gemini..." : "Ask Google AI"}</button>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{assistantAnswer}</div>
                </div>
              </div>
              <div className="rounded-[2rem] border border-slate-200 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950">Devices</h3>
                    <p className="mt-1 text-sm text-slate-600">Monitor customer computers, launch support, review alerts, and manage deployment status.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={copySupportClientLink} className="rounded-xl bg-assist px-4 py-2 text-sm font-black text-white">Deploy client</button>
                    <button onClick={() => setStatus("Device inventory refreshed.")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800">Refresh</button>
                    <button onClick={() => setStatus("CSV export queued for technician account.")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800">Export</button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {["All devices", "Online", "Needs attention", "Unassigned"].map((filter) => (
                    <button key={filter} onClick={() => setStatus(`${filter} filter selected.`)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-800 hover:bg-white">{filter}</button>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Device groups</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Finance", "Front Office", "Operations", "Unassigned"].map((group) => (
                        <span key={group} className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{group}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-warning">Open alerts</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">2</p>
                    <p className="text-xs font-bold text-slate-600">Reception-PC-02 needs attention.</p>
                  </div>
                  <div className="rounded-2xl border border-assist/20 bg-assist/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-assist">Package usage</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">3 / 4</p>
                    <p className="text-xs font-bold text-slate-600">Free plan device slots used.</p>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-[1.3fr_0.8fr_0.7fr_0.8fr_0.6fr_1fr] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    <span>Device</span>
                    <span>Group</span>
                    <span>Status</span>
                    <span>Health</span>
                    <span>Agent</span>
                    <span>Actions</span>
                  </div>
                  {managedDevices.map((device) => (
                    <div key={device.name} className="grid grid-cols-[1.3fr_0.8fr_0.7fr_0.8fr_0.6fr_1fr] items-center border-t border-slate-200 px-4 py-4 text-sm">
                      <div>
                        <p className="font-black text-slate-950">{device.name}</p>
                        <p className="text-xs text-slate-500">{device.os} Â· {device.lastSeen}</p>
                      </div>
                      <span className="font-bold text-slate-700">{device.group}</span>
                      <span className={device.status === "Online" ? "font-black text-assist" : "font-black text-slate-500"}>{device.status}</span>
                      <span className={device.alerts > 0 ? "font-black text-warning" : "font-black text-assist"}>{device.health}{device.alerts > 0 ? ` Â· ${device.alerts} alerts` : ""}</span>
                      <span className="font-mono text-xs text-slate-600">{device.version}</span>
                      <div className="flex flex-wrap gap-2">
                        {deviceActions.slice(0, 3).map((action) => (
                          <button key={action} onClick={() => setStatus(`${action} selected for ${device.name}.`)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-700 hover:bg-slate-50">{action}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {view === "home" && <><section className="grid gap-8 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-card lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div className="grid content-center gap-6">
            <div className="w-fit rounded-full border border-assist/20 bg-assist/10 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-assist">Remotixy technician console</div>
            <div>
              <h2 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">Securely connect to help users anywhere.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Technicians create a paid account, generate a host computer link, and send it to the customer. The customer opens the link to start the support client with visible consent.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => openSignup()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-assist px-6 py-4 font-black text-white shadow-glow transition hover:brightness-110">
                <MonitorUp className="h-5 w-5" />
                Technician sign up
              </button>
              <a href="#share" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 font-black text-slate-900 transition hover:bg-slate-100">
                <Users className="h-5 w-5" />
                I am on the host computer
              </a>
            </div>
          </div>
          <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-card">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <p className="font-black">Remote access suite</p>
                <span className="rounded-full bg-assist px-3 py-1 text-xs font-black text-white">Online</span>
              </div>
              <div className="mt-5 grid gap-3">
                {["Technician accounts", "Host install links", "Customer devices", "Usage reporting"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
                    <span className="font-bold">{item}</span>
                    <CheckCircle2 className="h-5 w-5 text-assist" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {productPillars.map((pillar) => (
            <div key={pillar.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
              <pillar.icon className="h-8 w-8 text-assist" />
              <h3 className="mt-4 text-2xl font-black text-slate-950">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.text}</p>
              <div className="mt-5 grid gap-2">
                {pillar.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm font-bold text-slate-700"><CheckCircle2 className="h-4 w-4 text-assist" />{feature}</div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section id="share" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center gap-3">
              <MonitorUp className="h-7 w-7 text-assist" />
              <div>
                <h2 className="text-2xl font-black">Host computer support client</h2>
                <p className="text-sm text-slate-400">This is what the customer opens from the technician-generated link.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {safetyItems.map((item) => (
                <label key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-assist" />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm font-semibold text-slate-800">
              <input checked={consentAccepted} onChange={(event) => setConsentAccepted(event.target.checked)} type="checkbox" className="h-5 w-5 accent-[#F8C14A]" />
              I understand and consent to sharing my screen for this session at any time.
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button onClick={startHosting} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-assist px-5 py-3 font-black text-white transition hover:brightness-110">
                <MonitorUp className="h-5 w-5" />
                Start visible support client
              </button>
              <button onClick={endSession} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-danger/40 bg-danger/10 px-5 py-3 font-black text-danger transition hover:bg-danger/20">
                <PhoneOff className="h-5 w-5" />
                End session
              </button>
            </div>

            {sessionCode && (
              <div className="mt-6 rounded-3xl border border-assist/30 bg-assist/10 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-assist">Session code</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-3xl font-black tracking-widest">{sessionCode}</p>
                  <button onClick={copyInvite} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-bold text-slate-900 hover:bg-slate-50">
                    <Clipboard className="h-5 w-5" />
                    Copy invite
                  </button>
                </div>
              </div>
            )}
          </section>

          <section id="join" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center gap-3">
              <Users className="h-7 w-7 text-assistBlue" />
              <div>
                <h2 className="text-2xl font-black">Join as helper</h2>
                <p className="text-sm text-slate-500">Use a code from someone who explicitly requested help.</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <label className="text-sm font-bold text-slate-600" htmlFor="session-code">Session code</label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input id="session-code" value={guestCode} onChange={handleGuestCode} placeholder="ABC-123-XYZ" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-lg uppercase outline-none ring-assistBlue/40 focus:ring-4" />
                <button onClick={joinSession} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-assistBlue px-5 py-3 font-black text-white transition hover:brightness-110">
                  <KeyRound className="h-5 w-5" />
                  Join
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><ShieldCheck className="h-5 w-5 shrink-0 text-assist" /> Confirm the host verbally before assisting.</div>
              <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><Eye className="h-5 w-5 shrink-0 text-assist" /> The host remains in control and can stop sharing instantly.</div>
              <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><Hand className="h-5 w-5 shrink-0 text-warning" /> Pointer requests are suggestions, not hidden clicks.</div>
            </div>
          </section>
        </div>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {suiteFeatures.map((feature) => (
            <div key={feature.title} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card">
              <feature.icon className="h-7 w-7 text-assistBlue" />
              <h3 className="mt-4 text-lg font-black text-slate-950">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
            </div>
          ))}
        </section>

        <section id="packages" className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-card lg:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-assist">Plans and packages</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Start free, upgrade when your device count grows.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">The free plan supports up to 4 devices. Paid packages unlock larger device fleets, operator controls, reporting, and business support.</p>
            </div>
            <div className="rounded-2xl border border-assist/20 bg-assist/10 px-4 py-3 text-sm font-black text-assist">Free up to 4 devices</div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-4">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={plan.highlight ? "relative rounded-[2rem] border-2 border-assist bg-assist/5 p-5 shadow-card" : "rounded-[2rem] border border-slate-200 bg-slate-50 p-5"}>
                {plan.highlight && <div className="absolute right-5 top-5 rounded-full bg-assist px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">Free</div>}
                <h3 className="text-2xl font-black text-slate-950">{plan.name}</h3>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-black text-slate-950">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="pb-1 text-sm font-bold text-slate-500">/mo</span>}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{plan.description}</p>
                <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-black text-assist">{plan.devices}</div>
                <div className="mt-5 grid gap-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-assist" />
                      {feature}
                    </div>
                  ))}
                </div>
                <button onClick={() => openSignup(plan.name)} className={plan.highlight ? "mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-assist px-4 py-3 font-black text-white transition hover:brightness-110" : "mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 font-black text-slate-900 transition hover:bg-slate-100"}>
                  {plan.name === "Free" ? "Start free" : "Choose package"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-card">
            <div onClick={placePointer} className="relative grid min-h-[420px] cursor-crosshair place-items-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="h-full max-h-[620px] w-full object-contain" />
              {!isSharing && (
                <div className="grid max-w-md place-items-center gap-4 text-center">
                  <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/10">
                    <MousePointer2 className="h-10 w-10 text-assist" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Session preview</h3>
                    <p className="mt-2 text-slate-400">Host screen preview appears here after browser permission is granted. Guest clicks create visible pointer requests only.</p>
                  </div>
                </div>
              )}
              {pointer && (
                <div className="absolute -translate-x-2 -translate-y-2" style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }}>
                  <div className="relative">
                    <MousePointer2 className="h-8 w-8 fill-assist text-background drop-shadow" />
                    <div className="absolute left-6 top-5 whitespace-nowrap rounded-xl bg-assist px-3 py-2 text-xs font-black text-white shadow-glow">{pointer.label}</div>
                  </div>
                </div>
              )}
              {isSharing && <div className="absolute left-4 top-4 rounded-2xl bg-danger px-4 py-2 text-sm font-black text-white">Screen sharing visible</div>}
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-assist" /><h3 className="text-xl font-black">Status</h3></div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{status}</p>
            </div>
            <div className="rounded-[2rem] border border-warning/30 bg-warning/10 p-5 shadow-card">
              <div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-warning" /><h3 className="text-xl font-black text-warning">Production note</h3></div>
              <p className="mt-4 text-sm leading-6 text-slate-600">To connect two browsers over the internet, add authenticated WebRTC signaling, short-lived session tokens, audit logs, TURN servers, and rate limiting.</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-3"><Lock className="h-6 w-6 text-assist" /><h3 className="text-xl font-black">Built-in boundaries</h3></div>
              <p className="mt-4 text-sm leading-6 text-slate-600">No background service, no credential collection, no stealth mode, and no unattended control.</p>
            </div>
          </aside>
        </section></>}
      </section>
    </main>
  );
}

