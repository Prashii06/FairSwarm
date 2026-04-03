from __future__ import annotations

from datetime import UTC, datetime
from typing import Any


class ReportGenerator:
    def build_json_report(
        self,
        analysis: dict[str, Any],
        dataset: dict[str, Any] | None,
        bias_report: dict[str, Any],
        swarm_results: list[dict[str, Any]],
    ) -> dict[str, Any]:
        fairness_metrics = bias_report.get("fairness_metrics") or {}
        by_attribute = fairness_metrics.get("metrics_by_sensitive_attribute", {})

        total_metrics = 0
        unfair_metrics = 0
        for payload in by_attribute.values() if isinstance(by_attribute, dict) else []:
            metrics = payload.get("metrics", []) if isinstance(payload, dict) else []
            total_metrics += len(metrics)
            unfair_metrics += sum(1 for item in metrics if not item.get("is_fair", False))

        agreement_score = self._derive_agreement_score(swarm_results)

        return {
            "generated_at": datetime.now(UTC).isoformat(),
            "analysis": analysis,
            "dataset": dataset,
            "overall_score": float(bias_report.get("overall_score", 0.0)),
            "fairness_metrics": fairness_metrics,
            "recommendations": bias_report.get("model_recommendations") or [],
            "swarm_consensus": {
                "agreement_score": agreement_score,
                "model_count": len(swarm_results),
            },
            "summary": {
                "total_metrics": total_metrics,
                "biased_metrics": unfair_metrics,
                "fair_metrics": max(total_metrics - unfair_metrics, 0),
            },
        }

    def top_findings(self, bias_report: dict[str, Any], limit: int = 3) -> list[dict[str, Any]]:
        fairness_metrics = bias_report.get("fairness_metrics") or {}
        by_attribute = fairness_metrics.get("metrics_by_sensitive_attribute", {})

        findings: list[dict[str, Any]] = []
        for sensitive_attribute, payload in by_attribute.items() if isinstance(by_attribute, dict) else []:
            metrics = payload.get("metrics", []) if isinstance(payload, dict) else []
            for metric in metrics:
                if metric.get("is_fair", False):
                    continue
                findings.append(
                    {
                        "sensitive_attribute": sensitive_attribute,
                        "metric_name": metric.get("metric_name"),
                        "value": metric.get("value"),
                        "severity": metric.get("severity", "medium"),
                    }
                )

        severity_rank = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        findings.sort(key=lambda item: severity_rank.get(str(item.get("severity", "low")), 0), reverse=True)
        return findings[:limit]

    def _derive_agreement_score(self, swarm_results: list[dict[str, Any]]) -> float:
        if not swarm_results:
            return 0.0

        confidence_values = [float(item.get("confidence_score", 0.0)) for item in swarm_results]
        return round((sum(confidence_values) / len(confidence_values)) * 100.0, 2)
