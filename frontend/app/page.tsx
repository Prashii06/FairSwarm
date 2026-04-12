"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BarChart2,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Code,
  Cpu,
  Download,
  ExternalLink,
  EyeOff,
  FileText,
  FileX,
  GitBranch,
  GitMerge,
  Github,
  Globe,
  History,
  Layers,
  LoaderCircle,
  Lock,
  Mail,
  Map,
  MapPin,
  Menu,
  RefreshCw,
  Scale,
  Shield,
  Star,
  TrendingUp,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { z } from "zod";
import { Toaster, toast } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetBrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const requiredSectionIds = [
  "hero",
  "problem",
  "how-it-works",
  "swarm-engine",
  "features",
  "ai-models",
  "live-demo",
  "tech-stack",
  "impact",
  "documentation",
  "faq",
  "testimonials",
  "contact",
] as const;

const observedSectionIds = ["live-ticker", "metrics", ...requiredSectionIds] as const;

type RequiredSectionId = (typeof requiredSectionIds)[number];

type FeatureTabKey = "analysts" | "organizations" | "developers";

type ContactSubject =
  | "General Inquiry"
  | "Partnership"
  | "Bug Report"
  | "Research Collaboration"
  | "Hackathon Judge"
  | "Enterprise Audit";

type ContactFormValues = {
  name: string;
  email: string;
  organization: string;
  subject: ContactSubject;
  message: string;
};

type ContactErrors = Partial<Record<keyof ContactFormValues, string>>;

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  organization: z.string().optional(),
  subject: z.enum([
    "General Inquiry",
    "Partnership",
    "Bug Report",
    "Research Collaboration",
    "Hackathon Judge",
    "Enterprise Audit",
  ]),
  message: z.string().min(20, "Message should be at least 20 characters."),
});

const newsletterSchema = z.string().email("Enter a valid email address.");

const navItems: Array<{ label: string; href: `#${RequiredSectionId}` }> = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "AI Models", href: "#ai-models" },
  { label: "Documentation", href: "#documentation" },
  { label: "Contact", href: "#contact" },
];

const heroStats = [
  { value: 7, suffix: "", label: "Fairness Metrics", decimals: 0 },
  { value: 4, suffix: "", label: "AI Models in Parallel", decimals: 0 },
  { value: 5, suffix: "", label: "< 5 min Audit Time", decimals: 0, prefix: "< " },
];

const problemStats = [
  { value: 73, suffix: "%", label: "of hiring AIs show gender bias (MIT study)", decimals: 0 },
  { value: 2, suffix: "x", label: "more likely Black defendants flagged high-risk by COMPAS", decimals: 1 },
  {
    value: 45,
    suffix: "%",
    label: "of medical AI systems underperform on minority populations (NEJM)",
    decimals: 0,
  },
];

const workflowSteps = [
  {
    id: "01",
    title: "Upload",
    description:
      "Upload your dataset (CSV, Excel, JSON) or connect your ML model. FairSwarm auto-detects sensitive attributes like gender, race, age, and religion.",
    Icon: UploadCloud,
    iconClass: "text-blue-600",
  },
  {
    id: "02",
    title: "Swarm Analyzes",
    description:
      "4 AI models fire simultaneously. Each model acts as a specialist in statistical, contextual, historical, and intersectional bias.",
    Icon: GitMerge,
    iconClass: "text-violet-600",
  },
  {
    id: "03",
    title: "Consensus",
    description:
      "Results are aggregated via weighted voting. The FairSwarm consensus is more accurate and harder to fool than any single model.",
    Icon: CheckCircle,
    iconClass: "text-emerald-600",
  },
  {
    id: "04",
    title: "Report",
    description:
      "Download a professional PDF audit report with metric values, severity ratings, and prioritized remediation guidance.",
    Icon: FileText,
    iconClass: "text-amber-600",
  },
];

type FeatureCard = {
  title: string;
  description: string;
  Icon: typeof UploadCloud;
  href?: string;
};

const featureTabs: Record<FeatureTabKey, { title: string; cards: FeatureCard[] }> = {
  analysts: {
    title: "For Analysts",
    cards: [
      {
        title: "Dataset Upload",
        description:
          "CSV, Excel, JSON support up to 50MB. Auto-detects columns, sensitive attributes, and target variable with zero configuration.",
        Icon: UploadCloud,
      },
      {
        title: "7 Fairness Metrics",
        description:
          "Disparate Impact Ratio, Statistical Parity, Equal Opportunity, Average Odds, Theil Index, Demographic Parity, Predictive Parity.",
        Icon: BarChart2,
      },
      {
        title: "Swarm Intelligence",
        description:
          "4 AI models analyze simultaneously. Weighted consensus yields one authoritative FairSwarm Score (0–100).",
        Icon: GitMerge,
      },
      {
        title: "Intersectional Heatmap",
        description:
          "Detect bias at intersections of gender, race, and age with an intuitive heatmap view built for fast triage.",
        Icon: Map,
      },
      {
        title: "PDF Audit Reports",
        description:
          "Professional 15-page reports with explanations, metric tables, and ranked remediation actions.",
        Icon: FileText,
      },
      {
        title: "Analysis History",
        description:
          "Track trends over time and compare before/after audits as you iterate on your model pipeline.",
        Icon: History,
      },
    ],
  },
  organizations: {
    title: "For Organizations",
    cards: [
      {
        title: "Compliance Ready",
        description:
          "Reports align with GDPR Article 22, EU AI Act expectations, and EEOC disparate impact review patterns.",
        Icon: Shield,
      },
      {
        title: "Team Workspace",
        description:
          "Invite team members, share analyses, and coordinate remediation with role-based access control.",
        Icon: Users,
      },
      {
        title: "Bias Alerts",
        description:
          "Set thresholds and receive immediate warning signals when fairness scores cross critical boundaries.",
        Icon: Bell,
      },
      {
        title: "Executive Dashboard",
        description:
          "Summaries for leadership with grades, trends, and unresolved risks across all active projects.",
        Icon: BarChart3,
      },
      {
        title: "Evidence Package",
        description:
          "Download compliance evidence bundles for audits, legal review, and policy board communication.",
        Icon: Download,
      },
      {
        title: "Re-audit Workflow",
        description:
          "Run iterative re-audits and verify fairness improvements after each model or data adjustment.",
        Icon: RefreshCw,
      },
    ],
  },
  developers: {
    title: "For Developers",
    cards: [
      {
        title: "REST API",
        description:
          "Programmatic access for uploading datasets, triggering analyses, and collecting results in CI/CD.",
        Icon: Code,
      },
      {
        title: "GitHub Integration",
        description:
          "Trigger fairness audits on pull requests and surface risk before deployment reaches production.",
        Icon: GitBranch,
      },
      {
        title: "Model Upload",
        description:
          "Upload scikit-learn and XGBoost artifacts for bias evaluation against your validation datasets.",
        Icon: Cpu,
      },
      {
        title: "API Documentation",
        description:
          "OpenAPI reference with practical examples in Python and JavaScript.",
        Icon: BookOpen,
        href: "#documentation",
      },
      {
        title: "Webhook Support",
        description:
          "Push analysis outcomes into Datadog, Grafana, or PagerDuty with webhook integrations.",
        Icon: Layers,
      },
      {
        title: "SOC 2 Ready Architecture",
        description:
          "Data encrypted at rest and in transit, secured with hardened auth and policy controls.",
        Icon: Lock,
      },
    ],
  },
};

const modelCards = [
  {
    title: "Agent 1 · Statistical Analyst",
    model: "meta/llama-3.3-70b-instruct",
    provider: "NVIDIA NIM",
    specialty: "Statistical Bias Analysis",
    description:
      "Analyzes disparate impact ratios, threshold violations, and statistical significance across demographic slices.",
    freeTier: "$25 free credits on signup",
    weight: "30% of final score",
    border: "border-emerald-300",
    badge: "bg-emerald-100 text-emerald-700",
    href: "https://build.nvidia.com",
  },
  {
    title: "Agent 2 · Contextual Expert",
    model: "gemini-2.0-flash-exp",
    provider: "Google AI Studio",
    specialty: "Contextual Fairness Analysis",
    description:
      "Evaluates social context and real-world impact on historically marginalized communities.",
    freeTier: "Free forever · 15 req/min",
    weight: "30% of final score",
    border: "border-blue-300",
    badge: "bg-blue-100 text-blue-700",
    href: "https://aistudio.google.com",
  },
  {
    title: "Agent 3 · Speed Specialist",
    model: "llama-3.3-70b-versatile",
    provider: "Groq Cloud",
    specialty: "Historical Pattern Detection",
    description:
      "Maps findings against known bias patterns in lending, hiring, justice, and healthcare history.",
    freeTier: "Free · 30 req/min · Fast inference",
    weight: "25% of final score",
    border: "border-amber-300",
    badge: "bg-amber-100 text-amber-700",
    href: "https://console.groq.com",
  },
  {
    title: "Agent 4 · Intersection Detector",
    model: "Mixtral-8x7B-Instruct-v0.1",
    provider: "HuggingFace",
    specialty: "Intersectional Bias Detection",
    description:
      "Detects hidden risk at intersections of race, gender, age, and other protected attributes.",
    freeTier: "Free Inference API",
    weight: "15% of final score",
    border: "border-cyan-300",
    badge: "bg-cyan-100 text-cyan-700",
    href: "https://huggingface.co/settings/tokens",
  },
];

const metrics = [
  {
    name: "Disparate Impact Ratio",
    threshold: "0.80–1.25",
    short: "Ratio of favorable outcomes between groups.",
    detail:
      "Disparate Impact compares selection rates between privileged and unprivileged groups. Values below 0.80 often indicate adverse impact. FairSwarm flags severity and recommends balancing strategies like reweighing.",
    tone: "from-emerald-500 to-amber-400",
  },
  {
    name: "Statistical Parity Difference",
    threshold: "-0.10 to 0.10",
    short: "Difference in prediction rates between groups.",
    detail:
      "Measures how often positive outcomes are assigned per group. Large gaps imply uneven treatment. FairSwarm explains practical consequences and confidence levels.",
    tone: "from-blue-500 to-red-500",
  },
  {
    name: "Equal Opportunity Difference",
    threshold: "-0.10 to 0.10",
    short: "Difference in true positive rates.",
    detail:
      "Equal Opportunity checks whether qualified candidates from different groups are recognized equally. FairSwarm highlights where one group is systematically overlooked.",
    tone: "from-cyan-500 to-amber-500",
  },
  {
    name: "Average Odds Difference",
    threshold: "-0.10 to 0.10",
    short: "Average of true-positive and false-positive gaps.",
    detail:
      "Average Odds balances multiple error-rate disparities. FairSwarm uses this to detect asymmetric harm and false alarms across groups.",
    tone: "from-violet-500 to-red-500",
  },
  {
    name: "Theil Index",
    threshold: "< 0.10",
    short: "Measures individual fairness inequality.",
    detail:
      "Theil Index captures distribution inequality at the individual level. Lower values indicate fairer outcome spread. Powered by IBM AIF360 implementations.",
    tone: "from-emerald-500 to-cyan-500",
  },
  {
    name: "Demographic Parity Difference",
    threshold: "near 0",
    short: "Difference in positive prediction rates.",
    detail:
      "Computed with Microsoft Fairlearn, this quantifies output-rate parity across groups. FairSwarm translates this metric into plain-language policy impact.",
    tone: "from-indigo-500 to-sky-500",
  },
  {
    name: "Predictive Parity",
    threshold: "0.90–1.10",
    short: "Precision equality across groups.",
    detail:
      "Predictive Parity checks whether positive predictions are equally reliable for each group. FairSwarm flags mismatches that undermine trust in model outputs.",
    tone: "from-amber-500 to-red-500",
  },
] as const;

const techStack = [
  {
    initial: "F",
    title: "Frontend",
    items: "Next.js 15.1 · TypeScript 5.7 · Tailwind CSS 3.4 · Framer Motion 11",
  },
  {
    initial: "B",
    title: "Backend",
    items: "FastAPI 0.115 · Python 3.12 · Pydantic v2 · Uvicorn",
  },
  {
    initial: "D",
    title: "Database",
    items: "Supabase PostgreSQL · Auth · Storage · Row Level Security",
  },
  {
    initial: "M",
    title: "Bias Libraries",
    items: "IBM AIF360 · Microsoft Fairlearn · scikit-learn · pandas 2.2",
  },
  {
    initial: "A",
    title: "AI Swarm",
    items: "NVIDIA NIM · Google Gemini · Groq Cloud · HuggingFace",
  },
  {
    initial: "R",
    title: "Reports",
    items: "ReportLab 4.2 · D3.js 7 · Recharts 2.13 · Python qrcode",
  },
  {
    initial: "H",
    title: "Hosting",
    items: "Vercel · Render · GitHub Actions",
  },
  {
    initial: "S",
    title: "Security",
    items: "JWT Auth · Rate Limiting · AES-256 · OWASP top-10",
  },
] as const;

const testimonials = [
  {
    quote:
      "FairSwarm found gender bias in our hiring algorithm in 4 minutes. The plain-English report made it easy to align with HR leadership.",
    author: "Anjali Sharma",
    role: "Data Scientist, Bangalore Tech Startup",
  },
  {
    quote:
      "When I tested COMPAS, FairSwarm surfaced the same racial bias pattern ProPublica documented. The swarm consensus is remarkably reliable.",
    author: "Dr. Priya Nair",
    role: "ML Researcher, IIT Bombay",
  },
  {
    quote:
      "As a compliance officer, the PDF audit report is exactly what I need for board review and regulatory conversations.",
    author: "Vikram Mehta",
    role: "AI Governance Lead, HDFC Digital",
  },
] as const;

const faqItems = [
  {
    q: "Is FairSwarm completely free?",
    a: "Yes. FairSwarm uses free-tier infrastructure and free AI API tiers, making it accessible for students, researchers, and early-stage teams.",
  },
  {
    q: "What file formats does FairSwarm accept?",
    a: "CSV, Excel (.xlsx), and JSON up to 50MB. We recommend at least 500 rows for statistically stable findings.",
  },
  {
    q: "How does the swarm engine work?",
    a: "Four AI agents run in parallel with specialized roles. Their outputs are aggregated through weighted voting into one FairSwarm Score and confidence level.",
  },
  {
    q: "Is raw dataset data sent to AI providers?",
    a: "No. Raw data remains in secured storage. Only computed summaries and fairness metrics are used for language-level interpretation.",
  },
  {
    q: "What is the FairSwarm Score?",
    a: "A 0–100 score where higher means more severe bias. Grades map as A: 0–20, B: 21–40, C: 41–60, D: 61–80, F: 81–100.",
  },
  {
    q: "Can FairSwarm audit ML models, not just datasets?",
    a: "Direct model auditing is on the roadmap. Today, FairSwarm focuses on dataset and outcome-level bias diagnostics.",
  },
  {
    q: "Which fairness metrics are measured?",
    a: "Disparate Impact, Statistical Parity, Equal Opportunity, Average Odds, Theil Index, Demographic Parity Difference, and Predictive Parity.",
  },
  {
    q: "Is FairSwarm open source?",
    a: "Yes. GitHub: https://github.com/Ankitkr-ak007/fairswarm",
  },
  {
    q: "How accurate is the bias detection?",
    a: "Validated on COMPAS with high swarm agreement. The mathematical backbone uses IBM AIF360 and Microsoft Fairlearn.",
  },
] as const;

const demoAgentResults = [
  "NVIDIA  — Disparate Impact: 0.61 · CRITICAL",
  "Gemini  — Statistical Parity: -0.24 · HIGH",
  "Groq    — Equal Opportunity: -0.18 · HIGH",
  "Mixtral — Intersectional: race×age · MEDIUM",
] as const;

function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const start = performance.now();
    const duration = 1500;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(value * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function RevealSection({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section id={id} className={className}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </section>
  );
}

function SectionHeading({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">{label}</p>
      <h2 className={`${plusJakarta.className} text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl`}>
        {title}
      </h2>
      {subtitle ? <p className="mt-3 text-base text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<RequiredSectionId>("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [selectedTab, setSelectedTab] = useState<FeatureTabKey>("analysts");
  const [openMetric, setOpenMetric] = useState<string>(metrics[0].name);
  const [openFaq, setOpenFaq] = useState<string>(faqItems[0].q);

  const [demoRunId, setDemoRunId] = useState(0);
  const [demoElapsed, setDemoElapsed] = useState(0);

  const [newsletterEmail, setNewsletterEmail] = useState("");

  const [contactValues, setContactValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    organization: "",
    subject: "General Inquiry",
    message: "",
  });
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("scroll-smooth");
    return () => document.documentElement.classList.remove("scroll-smooth");
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;

        const topId = visible[0].target.id;
        if ((requiredSectionIds as readonly string[]).includes(topId)) {
          setActiveSection(topId as RequiredSectionId);
        }
      },
      {
        threshold: [0.2, 0.4, 0.65],
        rootMargin: "-35% 0px -45% 0px",
      }
    );

    observedSectionIds.forEach((id) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(() => {
      const elapsedSeconds = ((Date.now() - start) / 1000) % 14;
      setDemoElapsed(elapsedSeconds);
    }, 100);

    return () => window.clearInterval(timer);
  }, [demoRunId]);

  const currentTab = useMemo(() => featureTabs[selectedTab], [selectedTab]);

  const runSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = newsletterSchema.safeParse(newsletterEmail.trim());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please provide a valid email.");
      return;
    }

    setNewsletterEmail("");
    toast.success("Thanks for subscribing!");
  };

  const updateContact = <K extends keyof ContactFormValues>(field: K, value: ContactFormValues[K]) => {
    setContactValues((prev) => ({ ...prev, [field]: value }));
    setContactErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = contactSchema.safeParse(contactValues);

    if (!parsed.success) {
      const nextErrors: ContactErrors = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ContactFormValues;
        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      });
      setContactErrors(nextErrors);
      return;
    }

    setContactErrors({});
    setContactSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    setContactSubmitting(false);
    setContactSuccess(true);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("fairswarm.team@gmail.com");
      toast.success("Copied!");
    } catch {
      toast.error("Unable to copy right now.");
    }
  };

  const demoFadeOut = demoElapsed >= 12;

  return (
    <div className={`${inter.className} bg-slate-50 text-slate-900`}>
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .fairswarm-marquee-track {
          animation: fairswarm-marquee 24s linear infinite;
        }

        .fairswarm-marquee:hover .fairswarm-marquee-track {
          animation-play-state: paused;
        }

        @keyframes fairswarm-marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .swarm-dot {
          animation: swarm-pulse 2s ease-in-out infinite;
        }

        .swarm-dot:nth-child(2) {
          animation-delay: 0.3s;
        }

        .swarm-dot:nth-child(3) {
          animation-delay: 0.6s;
        }

        .swarm-dot:nth-child(4) {
          animation-delay: 0.9s;
        }

        @keyframes swarm-pulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        .swarm-line {
          animation: line-glow 2.4s ease-in-out infinite;
        }

        @keyframes line-glow {
          0%,
          100% {
            opacity: 0.45;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>

      <Toaster richColors position="top-right" />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-slate-200 bg-white/90 backdrop-blur-md" : "bg-white"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#hero" className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className={`${plusJakarta.className} text-xl font-extrabold text-slate-900`}>FairSwarm</span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.href.replace("#", "");
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`relative text-sm font-semibold transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 w-full origin-left rounded-full bg-blue-600 transition-transform duration-200 ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <motion.a
              whileTap={{ scale: 0.97 }}
              href="https://github.com/Ankitkr-ak007/fairswarm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              GitHub <ExternalLink className="h-4 w-4" />
            </motion.a>
            <motion.a
              whileTap={{ scale: 0.97 }}
              href="/dashboard"
              className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Start Auditing
            </motion.a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex rounded-lg border border-slate-300 p-2 text-slate-700 lg:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border-t border-slate-200 bg-white px-4 py-4 shadow-sm lg:hidden"
            >
              <div className="space-y-2">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href="https://github.com/Ankitkr-ak007/fairswarm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  GitHub <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Start Auditing
                </a>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <RevealSection id="hero" className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: { opacity: 0, y: 30 },
              show: {
                opacity: 1,
                y: 0,
                transition: { staggerChildren: 0.12, duration: 0.45 },
              },
            }}
            className="space-y-6"
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
            >
              <Scale className="h-4 w-4" /> Google Solution Challenge 2026 · Open Innovation
            </motion.div>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className={`${plusJakarta.className} text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl`}
            >
              Detect AI Bias Before
              <br />
              It Harms Real People.
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="max-w-2xl text-base text-slate-600 sm:text-lg"
            >
              FairSwarm deploys 4 free AI models simultaneously. Each model audits your datasets from a distinct lens,
              then converges into one trusted FairSwarm Score. More reliable than any single model. Built for everyone.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="flex flex-wrap items-center gap-3"
            >
              <motion.a
                whileTap={{ scale: 0.97 }}
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Start Free Audit <ArrowRight className="h-4 w-4" />
              </motion.a>
              <motion.a
                whileTap={{ scale: 0.97 }}
                href="#live-demo"
                className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Explore Demo
              </motion.a>
            </motion.div>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              className="grid gap-3 sm:grid-cols-3"
            >
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className={`${plusJakarta.className} text-2xl font-extrabold text-slate-900`}>
                    <CountUp
                      value={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix ?? ""}
                      decimals={stat.decimals}
                    />
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 p-6 shadow-xl"
          >
            <div className="absolute right-6 top-6 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">Grade D</div>

            <div className="mx-auto w-full max-w-[320px]">
              <svg viewBox="0 0 220 220" className="h-64 w-full" aria-label="FairSwarm bias score gauge">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <circle cx="110" cy="110" r="82" fill="none" stroke="#dbeafe" strokeWidth="16" />
                <circle
                  cx="110"
                  cy="110"
                  r="82"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="515"
                  strokeDashoffset={515 - (515 * 76.4) / 100}
                  transform="rotate(-90 110 110)"
                />
                <text x="110" y="102" textAnchor="middle" className={`${plusJakarta.className}`} fontSize="44" fill="#0f172a" fontWeight="800">
                  76.4
                </text>
                <text x="110" y="127" textAnchor="middle" fontSize="13" fill="#475569">
                  Bias Score
                </text>
              </svg>

              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">COMPAS Dataset</p>
                <p className={`${plusJakarta.className} mt-1 text-sm font-bold text-red-700`}>Racial Bias Detected</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              {[
                { label: "Llama 3.3", color: "bg-blue-500" },
                { label: "Gemini 2.0", color: "bg-violet-500" },
                { label: "Groq", color: "bg-amber-500" },
                { label: "Mixtral", color: "bg-cyan-500" },
              ].map((agent) => (
                <div key={agent.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className={`swarm-dot h-2.5 w-2.5 rounded-full ${agent.color}`} />
                  {agent.label}
                </div>
              ))}
            </div>

            <div className="mt-6 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
          </motion.div>
        </div>
      </RevealSection>

      <RevealSection id="live-ticker" className="border-b border-slate-200 bg-slate-100 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-slate-700">Live audits running on FairSwarm (simulated)</p>
          <div className="fairswarm-marquee overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-3">
            <div className="fairswarm-marquee-track flex min-w-max gap-6 pr-6">
              {[
                { tone: "bg-red-500", text: "COMPAS Dataset · Racial Bias · Score 76.4 · Grade D · CRITICAL" },
                { tone: "bg-amber-500", text: "Adult Income · Gender Bias · Score 61.2 · Grade C · HIGH" },
                { tone: "bg-blue-500", text: "Hiring Algorithm · Age Bias · Score 43.1 · Grade B · MEDIUM" },
                { tone: "bg-emerald-500", text: "Credit Scoring · Regional Bias · Score 28.7 · Grade A · LOW" },
                { tone: "bg-red-500", text: "Medical Triage AI · Disability Bias · Score 81.3 · Grade F · CRITICAL" },
                { tone: "bg-red-500", text: "COMPAS Dataset · Racial Bias · Score 76.4 · Grade D · CRITICAL" },
                { tone: "bg-amber-500", text: "Adult Income · Gender Bias · Score 61.2 · Grade C · HIGH" },
                { tone: "bg-blue-500", text: "Hiring Algorithm · Age Bias · Score 43.1 · Grade B · MEDIUM" },
                { tone: "bg-emerald-500", text: "Credit Scoring · Regional Bias · Score 28.7 · Grade A · LOW" },
                { tone: "bg-red-500", text: "Medical Triage AI · Disability Bias · Score 81.3 · Grade F · CRITICAL" },
              ].map((item, index) => (
                <p key={`${item.text}-${index}`} className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-slate-700">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />
                  {item.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="problem" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="The Problem"
            title="AI makes life-changing decisions. Most are biased."
            subtitle="Algorithms now decide who gets a job, loan, bail, or treatment. Flawed historical data silently encodes decades of discrimination."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {problemStats.map((stat) => (
              <motion.div
                whileHover={{ scale: 1.02 }}
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className={`${plusJakarta.className} text-4xl font-extrabold text-slate-900`}>
                  <CountUp value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
                </p>
                <p className="mt-3 text-sm text-slate-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                Icon: EyeOff,
                title: "Hidden by Design",
                text: "Bias in AI is often invisible. Models learn from historically biased data and replicate discrimination silently.",
              },
              {
                Icon: TrendingUp,
                title: "Amplified at Scale",
                text: "A biased human hurts one person. A biased algorithm can hurt millions each day at machine speed.",
              },
              {
                Icon: FileX,
                title: "No Standard Audit",
                text: "Most teams lack practical, explainable bias auditing and compliance-grade evidence.",
              },
            ].map((card) => (
              <motion.div
                whileHover={{ scale: 1.02 }}
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <card.Icon className="h-6 w-6 text-blue-600" />
                <h3 className={`${plusJakarta.className} mt-4 text-lg font-bold text-slate-900`}>{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{card.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
            <p className="mx-auto max-w-3xl text-slate-700">
              FairSwarm changes this. Upload your dataset or model and instantly see what is biased, why it matters, and how to fix it.
            </p>
            <motion.a
              whileTap={{ scale: 0.97 }}
              href="#how-it-works"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              See How It Works <ArrowRight className="h-4 w-4" />
            </motion.a>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="how-it-works" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading label="How It Works" title="From upload to bias report in under 5 minutes" />

          <div className="relative grid gap-4 md:grid-cols-4">
            <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 hidden border-t border-dashed border-slate-300 md:block" />
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.15, duration: 0.4 }}
                className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="inline-flex items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">{step.id}</span>
                  <step.Icon className={`h-5 w-5 ${step.iconClass}`} />
                </div>
                <h3 className={`${plusJakarta.className} mt-3 text-lg font-bold text-slate-900`}>{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <motion.a
              whileTap={{ scale: 0.97 }}
              href="/dashboard"
              className="inline-flex items-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Ready to audit your AI?
            </motion.a>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="swarm-engine" className="py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">The Core Innovation</p>
            <h2 className={`${plusJakarta.className} text-3xl font-extrabold text-slate-900 sm:text-4xl`}>
              One AI can be biased. Four AI models reaching consensus cannot.
            </h2>
            <p className="mt-3 text-slate-600">
              Inspired by swarm intelligence, each FairSwarm agent is a specialist. Together they form a stronger and more
              trustworthy verdict.
            </p>

            <div className="relative mt-8 rounded-3xl border border-slate-200 bg-white p-8">
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-center">
                <p className={`${plusJakarta.className} text-sm font-bold text-blue-700`}>
                  FairSwarm
                  <br />
                  Consensus
                </p>
              </div>

              <div className="swarm-line absolute left-12 top-14 h-px w-20 bg-slate-300" />
              <div className="swarm-line absolute right-12 top-14 h-px w-20 bg-slate-300" />
              <div className="swarm-line absolute left-12 bottom-14 h-px w-20 bg-slate-300" />
              <div className="swarm-line absolute right-12 bottom-14 h-px w-20 bg-slate-300" />

              <div className="absolute left-4 top-8 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                NVIDIA Llama 3.3
                <br />
                Statistical Bias
              </div>
              <div className="absolute right-4 top-8 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700">
                Google Gemini 2.0
                <br />
                Contextual Fairness
              </div>
              <div className="absolute left-4 bottom-8 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Groq Llama 3.3
                <br />
                Historical Patterns
              </div>
              <div className="absolute right-4 bottom-8 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700">
                HF Mixtral 8x7B
                <br />
                Intersectional Bias
              </div>

              <div className="mx-auto mt-6 w-fit rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold text-emerald-700">
                87% Swarm Consensus
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <motion.div whileHover={{ scale: 1.02 }} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className={`${plusJakarta.className} text-lg font-bold text-slate-900`}>Why swarm?</h3>
              <p className="mt-2 text-sm text-slate-600">
                Single models have blind spots. FairSwarm ensures one model missing a bias pattern does not hide critical
                risk. Weighted aggregation prevents any agent from dominating the final verdict.
              </p>
            </motion.div>

            <div className="flex flex-wrap gap-2">
              {[
                { text: "Statistical Analyst", tone: "bg-blue-100 text-blue-700" },
                { text: "Contextual Expert", tone: "bg-violet-100 text-violet-700" },
                { text: "Historical Researcher", tone: "bg-amber-100 text-amber-700" },
                { text: "Intersectional Detector", tone: "bg-cyan-100 text-cyan-700" },
              ].map((pill) => (
                <span key={pill.text} className={`rounded-full px-3 py-1 text-xs font-semibold ${pill.tone}`}>
                  {pill.text}
                </span>
              ))}
            </div>

            <p className="text-sm text-slate-500">
              If one agent fails or times out, the swarm continues with remaining agents. FairSwarm degrades gracefully.
            </p>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Swarm confidence</span>
                <span className="font-bold text-blue-700">87%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "87%" }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full bg-blue-600"
                />
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="features" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Features" title="Everything you need to audit AI fairly" />

          <div className="mx-auto mb-8 inline-flex w-full max-w-xl rounded-full border border-slate-200 bg-slate-100 p-1">
            {(
              [
                ["analysts", "For Analysts"],
                ["organizations", "For Organizations"],
                ["developers", "For Developers"],
              ] as const
            ).map(([key, title]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTab(key)}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  selectedTab === key ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {title}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className={`${plusJakarta.className} mb-4 text-xl font-bold text-slate-900`}>{currentTab.title}</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {currentTab.cards.map((card) => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    key={card.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <card.Icon className="h-5 w-5 text-blue-600" />
                    <h4 className={`${plusJakarta.className} mt-3 text-lg font-bold text-slate-900`}>{card.title}</h4>
                    <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                    {card.href ? (
                      <a href={card.href} className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                        Documentation <ArrowRight className="ml-1 h-4 w-4" />
                      </a>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </RevealSection>

      <RevealSection id="ai-models" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="The Swarm"
            title="4 free AI models. One unified verdict."
            subtitle="FairSwarm uses freely available AI APIs to make enterprise-grade bias detection accessible to every team."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {modelCards.map((card) => (
              <motion.div
                whileHover={{ scale: 1.02 }}
                key={card.title}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${card.border}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.title}</p>
                <h3 className={`${plusJakarta.className} mt-2 text-lg font-bold text-slate-900`}>{card.model}</h3>
                <p className="text-sm text-slate-600">{card.provider}</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${card.badge}`}>{card.specialty}</span>
                <p className="mt-3 text-sm text-slate-600">{card.description}</p>
                <p className="mt-3 text-sm font-semibold text-slate-700">{card.freeTier}</p>
                <p className="text-sm text-slate-500">{card.weight}</p>
                <a
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Get key <ExternalLink className="h-4 w-4" />
                </a>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            All API keys are stored encrypted server-side. Your data never touches AI providers directly. Only structured
            analysis summaries are shared for interpretation.
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "IBM AIF360",
              "Microsoft Fairlearn",
              "scikit-learn",
              "Python 3.12",
            ].map((tag) => (
              <span key={tag} className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection id="live-demo" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Live Demo"
            title="Watch FairSwarm audit the COMPAS dataset"
            subtitle="COMPAS is a real algorithm used by US courts. FairSwarm reproduces known racial bias signals automatically."
          />

          <div className="rounded-2xl bg-slate-900 p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <p className={`${jetBrains.className} text-xs text-slate-300`}>
                FairSwarm Analysis Engine · COMPAS Dataset
              </p>
              <button
                type="button"
                onClick={() => setDemoRunId((prev) => prev + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Replay
              </button>
            </div>

            <div className={`${jetBrains.className} space-y-2 text-sm text-slate-200 transition-opacity duration-500 ${demoFadeOut ? "opacity-0" : "opacity-100"}`}>
              {demoElapsed >= 0 ? <p>&gt; Uploading compas_scores.csv (500 rows)...</p> : null}
              {demoElapsed >= 1 ? <p>&gt; Auto-detected sensitive columns: race, sex, age_cat</p> : null}
              {demoElapsed >= 1.5 ? <p>&gt; Target column: two_year_recid</p> : null}
              {demoElapsed >= 2 ? <p>&gt; Launching swarm — 4 agents firing simultaneously...</p> : null}

              {demoElapsed >= 2.5 ? (
                <div className="space-y-1 pt-2">
                  {demoAgentResults.map((result, index) => {
                    const completionTime = 4 + index * 0.3;
                    const done = demoElapsed >= completionTime;
                    return (
                      <p key={result} className={done ? "text-emerald-300" : "text-slate-300"}>
                        {done ? (
                          <span>[ ✓ ]</span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            [ <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> ]
                          </span>
                        )}{" "}
                        {done ? result : result.split("—")[0]}{done ? "" : "— analyzing"}
                      </p>
                    );
                  })}
                </div>
              ) : null}

              {demoElapsed >= 5.5 ? (
                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-800/70 p-3 text-slate-100">
                  <p>━━━ SWARM CONSENSUS ━━━</p>
                  <p>Agreement: 87% | Agents: 4/4</p>
                  <p className="text-blue-300">FairSwarm Score: 76.4 / 100</p>
                </div>
              ) : null}

              {demoElapsed >= 6.5 ? (
                <p className="inline-flex w-fit animate-pulse rounded bg-red-500/15 px-2 py-1 text-red-300">GRADE D — HEAVILY BIASED</p>
              ) : null}

              {demoElapsed >= 7.5 ? (
                <p className="text-amber-300">
                  &gt; Black defendants 2× more likely flagged high-risk than white defendants with equal actual recidivism.
                </p>
              ) : null}

              {demoElapsed >= 8.5 ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
                  <p>━━━ TOP RECOMMENDATION ━━━</p>
                  <p>1. Apply reweighing to training data immediately</p>
                  <p>2. Use Calibrated Equalized Odds post-processing</p>
                  <p>3. Collect representative data across racial groups</p>
                </div>
              ) : null}

              {demoElapsed >= 10 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    "PDF Report Ready",
                    "Download",
                    "Share",
                  ].map((label) => (
                    <span key={label} className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-100">
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-600">This is a real dataset with real bias. FairSwarm found it in 4.2 seconds.</p>
            <a
              href="/dashboard"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Audit your own data <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="metrics" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Fairness Metrics"
            title="7 metrics. Plain English. No statistics degree required."
          />

          <div className="space-y-3">
            {metrics.map((metric) => {
              const open = openMetric === metric.name;
              return (
                <motion.div whileHover={{ scale: 1.01 }} key={metric.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenMetric((prev) => (prev === metric.name ? "" : metric.name))}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <div>
                      <div className={`mb-2 h-1 w-20 rounded bg-gradient-to-r ${metric.tone}`} />
                      <h3 className={`${plusJakarta.className} text-lg font-bold text-slate-900`}>{metric.name}</h3>
                      <p className="text-sm text-slate-600">{metric.short}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="mb-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {metric.threshold}
                      </p>
                      <ChevronDown className={`ml-auto h-5 w-5 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-5"
                      >
                        <p className="text-sm text-slate-600">{metric.detail}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <a href="#documentation" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
              See full metric documentation <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="tech-stack" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Built With" title="Enterprise-grade stack. 100% free tier." />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {techStack.map((stack) => (
              <motion.div whileHover={{ scale: 1.02 }} key={stack.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-sm font-bold text-blue-700">
                  {stack.initial}
                </span>
                <h3 className={`${plusJakarta.className} mt-3 text-lg font-bold text-slate-900`}>{stack.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{stack.items}</p>
              </motion.div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm font-semibold text-blue-700">
            All services on free tier — built for students, researchers, and startups.
          </p>
        </div>
      </RevealSection>

      <RevealSection id="impact" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="UN SDG Alignment"
            title="Fighting algorithmic discrimination — for India and the world"
            subtitle="FairSwarm directly advances SDG 10, SDG 16, and SDG 8."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "SDG 10 — Reduced Inequalities",
                text: "FairSwarm helps organizations detect and reduce discrimination before models affect real lives.",
              },
              {
                title: "SDG 16 — Peace, Justice & Strong Institutions",
                text: "Transparent bias audits create accountability and defensible governance for AI-assisted decisions.",
              },
              {
                title: "SDG 8 — Decent Work & Economic Growth",
                text: "Fair hiring systems protect equal opportunity and prevent discriminatory rejection at scale.",
              },
            ].map((card) => (
              <motion.div whileHover={{ scale: 1.02 }} key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className={`${plusJakarta.className} text-lg font-bold text-slate-900`}>{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{card.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-900 p-6 text-slate-200">
            <h3 className={`${plusJakarta.className} text-2xl font-bold text-white`}>India Context</h3>
            <p className="mt-2 text-sm text-slate-300">
              India’s AI adoption across banking, government welfare, and healthcare is accelerating. Without robust bias
              auditing, these systems can encode caste, gender, and regional inequities at national scale.
            </p>
            <p className="mt-4 text-lg font-bold text-blue-300">
              340M+ Indians may be affected by AI decisions in hiring and lending by 2028 (NASSCOM)
            </p>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="documentation" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Documentation" title="Everything you need to get started" />

          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Navigation</p>
                <div className="space-y-1">
                  <a href="#doc-quickstart" className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                    Quick Start Guide
                  </a>
                  <a href="#documentation" className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                    API Reference
                  </a>
                  <a href="#doc-dataset" className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                    Dataset Requirements
                  </a>
                  <a href="#metrics" className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                    Fairness Metrics
                  </a>
                  <a href="#doc-swarm" className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                    Swarm Configuration
                  </a>
                  <a href="#doc-reports" className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                    Report Format
                  </a>
                  <a href="#doc-security" className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                    Security & Privacy
                  </a>
                  <a
                    href="https://github.com/Ankitkr-ak007/fairswarm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
                  >
                    GitHub Repository <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </aside>

            <div className="space-y-4">
              <motion.article whileHover={{ scale: 1.01 }} id="doc-quickstart" className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className={`${plusJakarta.className} text-xl font-bold text-slate-900`}>Quick Start Guide</h3>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                  <li>Create a free account at fairswarm.vercel.app/dashboard</li>
                  <li>Upload CSV/Excel/JSON dataset (max 50MB)</li>
                  <li>Confirm sensitive columns</li>
                  <li>Select target outcome column</li>
                  <li>Click Run Swarm Analysis</li>
                  <li>View results in 3–5 minutes</li>
                  <li>Download PDF audit report</li>
                </ol>
                <a href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                  Start Now <ArrowRight className="h-4 w-4" />
                </a>
              </motion.article>

              <motion.article whileHover={{ scale: 1.01 }} id="doc-api" className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className={`${plusJakarta.className} text-xl font-bold text-slate-900`}>API Reference</h3>
                <p className="mt-2 text-sm text-slate-600">Base URL: https://fairswarm-backend.onrender.com/api/v1</p>
                <p className="text-sm text-slate-600">Auth: Bearer JWT token</p>
                <pre className={`${jetBrains.className} mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-200`}>
{`POST /datasets/upload    Upload dataset file
POST /analysis/start     Start bias analysis
GET  /analysis/{id}      Get results
GET  /reports/{id}/pdf   Download PDF report
POST /ai/triage          Run swarm analysis`}
                </pre>
                <a
                  href="https://fairswarm-backend.onrender.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
                >
                  Open API Docs <ExternalLink className="h-4 w-4" />
                </a>
              </motion.article>

              <motion.article whileHover={{ scale: 1.01 }} id="doc-dataset" className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className={`${plusJakarta.className} text-xl font-bold text-slate-900`}>Dataset Requirements</h3>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Formats: CSV, Excel (.xlsx), JSON</li>
                  <li>Max file size: 50MB</li>
                  <li>Minimum rows: 100 (recommended 500+)</li>
                  <li>At least one target/outcome column</li>
                  <li>Sensitive attributes auto-detected or manually selected</li>
                </ul>
              </motion.article>

              <motion.article whileHover={{ scale: 1.01 }} id="doc-swarm" className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className={`${plusJakarta.className} text-xl font-bold text-slate-900`}>Swarm Configuration</h3>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>NVIDIA Llama 3.3: 30% weight</li>
                  <li>Google Gemini 2.0: 30% weight</li>
                  <li>Groq Llama 3.3: 25% weight</li>
                  <li>HF Mixtral 8x7B: 15% weight</li>
                  <li>Fault tolerance: continues with partial agents</li>
                </ul>
              </motion.article>

              <motion.article whileHover={{ scale: 1.01 }} id="doc-reports" className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className={`${plusJakarta.className} text-xl font-bold text-slate-900`}>Report Format</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Includes Executive Summary, Dataset Overview, 7 Metrics, Consensus, Heatmap, Recommendations,
                  Methodology, and Glossary.
                </p>
                <p className="text-sm text-slate-600">Export formats: PDF and JSON</p>
                <a href="/dashboard" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  Sample Report <ExternalLink className="h-4 w-4" />
                </a>
              </motion.article>

              <motion.article whileHover={{ scale: 1.01 }} id="doc-security" className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className={`${plusJakarta.className} text-xl font-bold text-slate-900`}>Security & Privacy</h3>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Datasets encrypted at rest (AES-256)</li>
                  <li>Only analysis summaries sent to AI APIs</li>
                  <li>JWT authentication and Google OAuth support</li>
                  <li>Row-level security policies on all tables</li>
                  <li>Rate limiting for global and AI endpoints</li>
                  <li>HTTPS and TLS 1.3 across the platform</li>
                </ul>
              </motion.article>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="testimonials" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="What People Say"
            title="Trusted by researchers, developers, and compliance teams"
            subtitle="Illustrative quotes for demonstration purposes"
          />

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <motion.div whileHover={{ scale: 1.02 }} key={item.author} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-3 flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <p className="text-sm text-slate-700">“{item.quote}”</p>
                <p className={`${plusJakarta.className} mt-4 text-sm font-bold text-slate-900`}>{item.author}</p>
                <p className="text-xs text-slate-500">{item.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection id="faq" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading label="FAQ" title="Frequently asked questions" />

          <div className="space-y-3">
            {faqItems.map((item) => {
              const open = openFaq === item.q;
              return (
                <div key={item.q} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setOpenFaq((prev) => (prev === item.q ? "" : item.q))}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className={`${plusJakarta.className} text-base font-bold text-slate-900`}>{item.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pb-5 text-sm text-slate-600"
                      >
                        <p>{item.a}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      <RevealSection id="contact" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            label="Contact"
            title="Get in touch"
            subtitle="Questions about FairSwarm, collaboration opportunities, or bias auditing for your organization?"
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              {[
                {
                  Icon: Mail,
                  title: "Email",
                  value: "ankitkr.ak007@gmail.com",
                  action: copyEmail,
                  kind: "button" as const,
                },
                {
                  Icon: Github,
                  title: "GitHub Repository",
                  value: "github.com/Ankitkr-ak007/fairswarm",
                  href: "https://github.com/Ankitkr-ak007/fairswarm",
                  kind: "link" as const,
                },
                {
                  Icon: Globe,
                  title: "Live Demo",
                  value: "fairswarm.vercel.app",
                  href: "https://fair-swarm.vercel.app",
                  kind: "link" as const,
                },
                {
                  Icon: MapPin,
                  title: "Location",
                  value: "India · Google Solution Challenge 2026",
                  kind: "text" as const,
                },
                {
                  Icon: BookOpen,
                  title: "Documentation",
                  value: "Full docs available",
                  href: "#documentation",
                  kind: "local" as const,
                },
                {
                  Icon: Scale,
                  title: "Open Source",
                  value: "MIT License · Free forever",
                  href: "https://github.com/Ankitkr-ak007/fairswarm",
                  kind: "link" as const,
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="rounded-lg bg-blue-100 p-2 text-blue-600">
                      <item.Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className={`${plusJakarta.className} text-sm font-bold text-slate-900`}>{item.title}</p>
                      {item.kind === "button" ? (
                        <button type="button" onClick={item.action} className="text-sm text-slate-600 hover:text-blue-600">
                          {item.value}
                        </button>
                      ) : null}
                      {item.kind === "link" && item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 hover:text-blue-600">
                          {item.value}
                        </a>
                      ) : null}
                      {item.kind === "local" && item.href ? (
                        <a href={item.href} className="text-sm text-slate-600 hover:text-blue-600">
                          {item.value}
                        </a>
                      ) : null}
                      {item.kind === "text" ? <p className="text-sm text-slate-600">{item.value}</p> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              {!contactSuccess ? (
                <form onSubmit={submitContact} className="space-y-4" noValidate>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="contact-name">
                      Name*
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={contactValues.name}
                      onChange={(event) => updateContact("name", event.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
                    />
                    <AnimatePresence>
                      {contactErrors.name ? (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1 text-xs text-red-600">
                          {contactErrors.name}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="contact-email">
                      Email*
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={contactValues.email}
                      onChange={(event) => updateContact("email", event.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
                    />
                    <AnimatePresence>
                      {contactErrors.email ? (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1 text-xs text-red-600">
                          {contactErrors.email}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="contact-org">
                      Organization
                    </label>
                    <input
                      id="contact-org"
                      type="text"
                      value={contactValues.organization}
                      onChange={(event) => updateContact("organization", event.target.value)}
                      placeholder="Company / University / Independent"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="contact-subject">
                      Subject*
                    </label>
                    <select
                      id="contact-subject"
                      value={contactValues.subject}
                      onChange={(event) => updateContact("subject", event.target.value as ContactSubject)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
                    >
                      {(
                        [
                          "General Inquiry",
                          "Partnership",
                          "Bug Report",
                          "Research Collaboration",
                          "Hackathon Judge",
                          "Enterprise Audit",
                        ] as const
                      ).map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                    <AnimatePresence>
                      {contactErrors.subject ? (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1 text-xs text-red-600">
                          {contactErrors.subject}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="contact-message">
                      Message*
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={contactValues.message}
                      onChange={(event) => updateContact("message", event.target.value)}
                      placeholder="Tell us about your use case or question..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
                    />
                    <AnimatePresence>
                      {contactErrors.message ? (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1 text-xs text-red-600">
                          {contactErrors.message}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={contactSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {contactSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                    Send Message <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </form>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <CheckCircle className="mx-auto h-9 w-9 text-emerald-600" />
                  <p className={`${plusJakarta.className} mt-2 text-lg font-bold text-emerald-800`}>Message sent!</p>
                  <p className="mt-1 text-sm text-emerald-700">We’ll get back to you within 24 hours.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSuccess(false);
                      setContactValues({
                        name: "",
                        email: "",
                        organization: "",
                        subject: "General Inquiry",
                        message: "",
                      });
                    }}
                    className="mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Send another
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </RevealSection>

      <footer className="border-t border-slate-800 bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-800/70 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`${plusJakarta.className} text-lg font-bold text-white`}>Stay updated on AI fairness</p>
              <p className="text-sm text-slate-400">Monthly updates on fairness methods, audits, and product releases.</p>
            </div>
            <form onSubmit={runSubscribe} className="flex w-full max-w-md gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-blue-400 focus:ring"
              />
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Subscribe
              </button>
            </form>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className={`${plusJakarta.className} mb-3 text-sm font-bold text-white`}>Product</p>
              <div className="flex flex-col space-y-2 text-sm">
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#ai-models">AI Models</a>
                <a href="#live-demo">Live Demo</a>
                <a href="#metrics">Fairness Metrics</a>
                <a href="#swarm-engine">Swarm Engine</a>
              </div>
            </div>

            <div>
              <p className={`${plusJakarta.className} mb-3 text-sm font-bold text-white`}>Resources</p>
              <div className="flex flex-col space-y-2 text-sm">
                <a href="#documentation">Documentation</a>
                <a href="#documentation">API Reference</a>
                <a href="#doc-quickstart">Quick Start</a>
                <a href="#doc-dataset">Dataset Guide</a>
                <a href="#doc-security">Security</a>
                <a href="https://github.com/Ankitkr-ak007/fairswarm" target="_blank" rel="noopener noreferrer">
                  GitHub ↗
                </a>
              </div>
            </div>

            <div>
              <p className={`${plusJakarta.className} mb-3 text-sm font-bold text-white`}>Company</p>
              <div className="flex flex-col space-y-2 text-sm">
                <a href="#hero">About FairSwarm</a>
                <a href="#impact">SDG Impact</a>
                <a href="#testimonials">Testimonials</a>
                <a href="#faq">FAQ</a>
                <a href="#contact">Contact</a>
                <a
                  href="https://developers.google.com/community/gdsc-solution-challenge"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solution Challenge
                </a>
              </div>
            </div>

            <div>
              <p className={`${plusJakarta.className} mb-3 text-sm font-bold text-white`}>Built With</p>
              <div className="flex flex-col space-y-2 text-sm text-slate-400">
                <p>Next.js 15 · FastAPI · Supabase</p>
                <p>IBM AIF360 · Fairlearn</p>
                <p>NVIDIA NIM · Google Gemini</p>
                <p>Groq · HuggingFace</p>
                <p>Vercel · Render</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-700 pt-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
              <p className="text-sm text-slate-400">© 2026 FairSwarm. MIT License. Built for Google Solution Challenge 2026.</p>

              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Scale className="h-4 w-4 text-blue-400" /> FairSwarm — Making AI fair for everyone
              </p>

              <div className="justify-self-start rounded-xl border border-slate-700 bg-slate-800 p-4 lg:justify-self-end">
                <p className="text-sm text-slate-400">Designed & Developed by</p>
                <p className={`${plusJakarta.className} text-2xl font-extrabold text-white`}>Ankit Kumar</p>
                <p className="text-sm text-blue-400">Lead Developer · FairSwarm Team</p>
                <p className="text-xs text-slate-500">Google Developer Student Club · India · 2026</p>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-600">
              <p>Built with Next.js · FastAPI · Supabase · IBM AIF360 · Microsoft Fairlearn · Google Gemini AI</p>
              <p>Deployed on Vercel + Render · Open Source MIT License</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
