"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { Card } from "@/components/ui/card";

type GlossaryTerm = {
  name: string;
  plainEnglish: string;
  mathDefinition: string;
  realWorldExample: string;
  whyItMattersIndia: string;
};

const TERMS: GlossaryTerm[] = [
  {
    name: "Disparate Impact",
    plainEnglish: "Compares favorable outcomes between protected and reference groups.",
    mathDefinition: "DI = P(y=1 | unprivileged) / P(y=1 | privileged)",
    realWorldExample: "If loan approvals are 40% for Group A and 20% for Group B, DI is 0.50.",
    whyItMattersIndia:
      "In lending, applicants from historically underserved castes or districts can be disproportionately denied even with similar repayment history.",
  },
  {
    name: "Statistical Parity Difference",
    plainEnglish: "Difference in positive prediction rates across groups.",
    mathDefinition: "SPD = P(y=1 | unprivileged) - P(y=1 | privileged)",
    realWorldExample: "If hiring model selects 28% women and 35% men, SPD is -0.07.",
    whyItMattersIndia:
      "Hiring models can under-select women or candidates from non-metro regions despite similar qualifications.",
  },
  {
    name: "Equal Opportunity",
    plainEnglish: "Checks if true positive rates are similar across groups.",
    mathDefinition: "EOD = TPR(unprivileged) - TPR(privileged)",
    realWorldExample: "Approved truly eligible loan applicants should have similar TPR across groups.",
    whyItMattersIndia:
      "Public welfare scoring systems should not miss eligible candidates from rural or tribal communities at higher rates.",
  },
  {
    name: "Equalized Odds",
    plainEnglish: "Ensures both true positive and false positive rates are balanced.",
    mathDefinition: "Compare TPR and FPR across protected groups",
    realWorldExample: "A fraud model that flags one region more often despite similar behavior violates equalized odds.",
    whyItMattersIndia:
      "Risk and compliance models for digital payments should not penalize specific states due to historical data skew.",
  },
  {
    name: "Predictive Parity",
    plainEnglish: "Checks whether precision is similar across groups.",
    mathDefinition: "PPV(unprivileged) ~= PPV(privileged)",
    realWorldExample: "When the model predicts approval, quality should be equally reliable for all groups.",
    whyItMattersIndia:
      "In hiring and scholarships, predictions must maintain comparable reliability across gender, caste, and region.",
  },
];

const RESOURCE_LINKS = [
  {
    label: "IBM AIF360 Documentation",
    href: "https://aif360.readthedocs.io/",
  },
  {
    label: "Fairlearn User Guide",
    href: "https://fairlearn.org/",
  },
  {
    label: "NITI Aayog Responsible AI Principles",
    href: "https://www.niti.gov.in/",
  },
  {
    label: "OECD AI Principles",
    href: "https://oecd.ai/en/ai-principles",
  },
];

export default function DocumentationPage() {
  const [ratioInput, setRatioInput] = useState("0.80");

  const calculator = useMemo(() => {
    const value = Number(ratioInput);
    if (Number.isNaN(value) || value < 0) {
      return {
        status: "invalid",
        message: "Enter a valid non-negative ratio.",
      } as const;
    }

    if (value >= 0.8 && value <= 1.25) {
      return {
        status: "pass",
        message: "Passes common threshold band (0.80 to 1.25).",
      } as const;
    }

    return {
      status: "fail",
      message: "Outside threshold band. Investigate potential disparate impact.",
    } as const;
  }, [ratioInput]);

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />

      <div className="w-full pb-20 lg:pb-0">
        <div className="fs-shell space-y-6 py-6">
          <header>
            <p className="fs-section-title">Fairness Documentation</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Interactive Glossary and Learning Hub</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Understand fairness metrics in plain language, see formal definitions, and connect each term to practical
              deployment risks in India.
            </p>
          </header>

          <section className="space-y-4">
            {TERMS.map((term) => (
              <Card key={term.name} className="space-y-3" aria-label={`${term.name} definition card`}>
                <h2 className="text-xl font-semibold text-white">{term.name}</h2>
                <p className="text-sm text-slate-200">
                  <span className="font-semibold text-white">Plain English:</span> {term.plainEnglish}
                </p>
                <p className="rounded border border-border bg-surface px-3 py-2 font-mono text-xs text-secondary">
                  {term.mathDefinition}
                </p>
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-white">Example:</span> {term.realWorldExample}
                </p>
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-white">Why it matters in India:</span> {term.whyItMattersIndia}
                </p>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
            <Card className="space-y-3" aria-label="Disparate impact calculator">
              <h2 className="text-xl font-semibold text-white">Disparate Impact Calculator</h2>
              <p className="text-sm text-slate-300">
                Enter your ratio to quickly check whether it passes common fairness thresholds.
              </p>

              <label htmlFor="di-ratio" className="text-xs uppercase tracking-[0.14em] text-slate-400">
                Disparate Impact Ratio
              </label>
              <input
                id="di-ratio"
                value={ratioInput}
                onChange={(event) => setRatioInput(event.target.value)}
                inputMode="decimal"
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-white outline-none"
                aria-describedby="di-help"
                aria-label="Disparate impact ratio input"
              />
              <p id="di-help" className="text-xs text-slate-400">
                Typical compliance checks use 0.80 as the minimum acceptable ratio.
              </p>

              <div
                role="status"
                aria-live="polite"
                className={
                  calculator.status === "pass"
                    ? "rounded border border-accent bg-surface px-3 py-2 text-sm text-accent"
                    : calculator.status === "fail"
                      ? "rounded border border-danger bg-surface px-3 py-2 text-sm text-danger"
                      : "rounded border border-warning bg-surface px-3 py-2 text-sm text-warning"
                }
              >
                {calculator.message}
              </div>
            </Card>

            <Card className="space-y-3" aria-label="Mitigation learning resources">
              <h2 className="text-xl font-semibold text-white">Mitigation Resources</h2>
              <p className="text-sm text-slate-300">
                Explore practical frameworks and references to reduce bias during model lifecycle reviews.
              </p>

              <ul className="space-y-2 text-sm">
                {RESOURCE_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-between rounded border border-border bg-surface px-3 py-2 text-secondary hover:text-primary"
                      aria-label={`Open ${item.label} in a new tab`}
                    >
                      {item.label}
                      <span aria-hidden>{"->"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}
