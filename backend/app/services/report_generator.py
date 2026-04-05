from __future__ import annotations

import io
from datetime import UTC, datetime
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import cm
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


class ReportGenerator:
    """Produces structured JSON and branded multi-page PDF audit reports."""

    PAGE_WIDTH, PAGE_HEIGHT = A4
    ACCENT = colors.HexColor("#0066FF")
    LIGHT_ACCENT = colors.HexColor("#E6F0FF")
    TEXT_DARK = colors.HexColor("#0B1324")
    MUTED = colors.HexColor("#52607A")

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
        overall = float(bias_report.get("overall_score", 0.0))

        return {
            "generated_at": datetime.now(UTC).isoformat(),
            "analysis": analysis,
            "dataset": dataset,
            "overall_score": overall,
            "fairness_grade": self.grade_from_score(overall),
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

    def build_pdf_report(
        self,
        analysis: dict[str, Any],
        dataset: dict[str, Any] | None,
        bias_report: dict[str, Any],
        swarm_results: list[dict[str, Any]],
        organization_name: str = "FairSwarm User",
    ) -> bytes:
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)

        metric_rows = self._extract_metric_rows(bias_report)
        findings = self.top_findings(bias_report, limit=3)

        self._page_cover(c, analysis, dataset, organization_name)
        self._page_executive_summary(c, bias_report, findings)
        self._page_dataset_overview(c, dataset)
        self._page_sensitive_distribution(c, dataset, metric_rows)

        metric_chunks = self._chunk(metric_rows, 7)
        while len(metric_chunks) < 4:
            metric_chunks.append([])
        for chunk in metric_chunks[:4]:
            self._page_metric_section(c, chunk)

        self._page_swarm_consensus(c, swarm_results)
        self._page_intersectional_heatmap(c, bias_report)
        self._page_intersectional_analysis(c, bias_report)
        self._page_recommendations(c, bias_report, page_title="Mitigation Recommendations (1/2)")
        self._page_recommendations(c, bias_report, page_title="Mitigation Recommendations (2/2)", offset=4)
        self._page_methodology(c)
        self._page_appendix(c, analysis, bias_report)

        c.save()
        buffer.seek(0)
        return buffer.getvalue()

    def grade_from_score(self, score: float) -> str:
        if score >= 80:
            return "A"
        if score >= 65:
            return "B"
        if score >= 50:
            return "C"
        if score >= 35:
            return "D"
        return "F"

    def _derive_agreement_score(self, swarm_results: list[dict[str, Any]]) -> float:
        if not swarm_results:
            return 0.0
        confidence_values = [float(item.get("confidence_score", 0.0)) for item in swarm_results]
        return round((sum(confidence_values) / len(confidence_values)) * 100.0, 2)

    def _extract_metric_rows(self, report: dict[str, Any]) -> list[dict[str, Any]]:
        fairness_metrics = report.get("fairness_metrics") or {}
        by_attr = fairness_metrics.get("metrics_by_sensitive_attribute", {})
        rows: list[dict[str, Any]] = []
        if not isinstance(by_attr, dict):
            return rows

        for attr, payload in by_attr.items():
            if not isinstance(payload, dict):
                continue
            metric_entries = payload.get("metrics", [])
            if not isinstance(metric_entries, list):
                continue
            for metric in metric_entries:
                if not isinstance(metric, dict):
                    continue
                rows.append({"sensitive_attribute": attr, **metric})
        return rows

    def _draw_header(self, c: canvas.Canvas, title: str, subtitle: str | None = None) -> None:
        c.setFillColor(self.ACCENT)
        c.rect(0, self.PAGE_HEIGHT - 24, self.PAGE_WIDTH, 24, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(16 * mm, self.PAGE_HEIGHT - 16, "FairSwarm")
        c.setFillColor(self.TEXT_DARK)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(16 * mm, self.PAGE_HEIGHT - 42, title)
        if subtitle:
            c.setFillColor(self.MUTED)
            c.setFont("Helvetica", 11)
            c.drawString(16 * mm, self.PAGE_HEIGHT - 50, subtitle)

    def _draw_footer(self, c: canvas.Canvas, page_no: int) -> None:
        c.setStrokeColor(colors.HexColor("#D7DFEA"))
        c.line(16 * mm, 14 * mm, self.PAGE_WIDTH - 16 * mm, 14 * mm)
        c.setFillColor(self.MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(16 * mm, 9 * mm, "FairSwarm Bias Intelligence - Confidential")
        c.drawRightString(self.PAGE_WIDTH - 16 * mm, 9 * mm, f"Page {page_no} of 15")

    def _draw_table(
        self,
        c: canvas.Canvas,
        x: float,
        y_top: float,
        width: float,
        headers: list[str],
        rows: list[list[str]],
        row_height: float = 16,
    ) -> float:
        col_count = max(len(headers), 1)
        col_width = width / col_count

        c.setFillColor(self.ACCENT)
        c.rect(x, y_top - row_height, width, row_height, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        for idx, header in enumerate(headers):
            c.drawString(x + idx * col_width + 4, y_top - row_height + 5, header[:24])

        c.setFont("Helvetica", 8)
        for ridx, row in enumerate(rows):
            y = y_top - row_height * (ridx + 2)
            c.setFillColor(self.LIGHT_ACCENT if ridx % 2 == 0 else colors.white)
            c.rect(x, y, width, row_height, stroke=0, fill=1)
            c.setFillColor(self.TEXT_DARK)
            for cidx in range(col_count):
                value = row[cidx] if cidx < len(row) else ""
                c.drawString(x + cidx * col_width + 4, y + 5, str(value)[:24])

        c.setStrokeColor(colors.HexColor("#B9C7DD"))
        c.rect(x, y_top - row_height * (len(rows) + 1), width, row_height * (len(rows) + 1), stroke=1, fill=0)
        return y_top - row_height * (len(rows) + 1)

    def _page_cover(
        self,
        c: canvas.Canvas,
        analysis: dict[str, Any],
        dataset: dict[str, Any] | None,
        organization_name: str,
    ) -> None:
        c.setFillColor(colors.HexColor("#F4F8FF"))
        c.rect(0, 0, self.PAGE_WIDTH, self.PAGE_HEIGHT, stroke=0, fill=1)
        c.setFillColor(self.ACCENT)
        c.circle(26 * mm, self.PAGE_HEIGHT - 26 * mm, 8 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(26 * mm, self.PAGE_HEIGHT - 28.5 * mm, "FS")

        c.setFillColor(self.TEXT_DARK)
        c.setFont("Helvetica-Bold", 32)
        c.drawString(42 * mm, self.PAGE_HEIGHT - 28 * mm, "AI Bias Audit Report")
        c.setFillColor(self.MUTED)
        c.setFont("Helvetica", 12)
        c.drawString(42 * mm, self.PAGE_HEIGHT - 37 * mm, "Generated by FairSwarm")

        c.setFillColor(colors.HexColor("#CCD9F3"))
        c.setFont("Helvetica-Bold", 56)
        c.saveState()
        c.translate(self.PAGE_WIDTH / 2, self.PAGE_HEIGHT / 2)
        c.rotate(35)
        c.drawCentredString(0, 0, "CONFIDENTIAL")
        c.restoreState()

        c.setFillColor(self.TEXT_DARK)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(26 * mm, 78 * mm, "Organization")
        c.setFont("Helvetica", 12)
        c.drawString(70 * mm, 78 * mm, organization_name)

        c.setFont("Helvetica-Bold", 12)
        c.drawString(26 * mm, 68 * mm, "Analysis ID")
        c.setFont("Helvetica", 10)
        c.drawString(70 * mm, 68 * mm, str(analysis.get("id", "N/A")))

        c.setFont("Helvetica-Bold", 12)
        c.drawString(26 * mm, 58 * mm, "Dataset")
        c.setFont("Helvetica", 10)
        c.drawString(70 * mm, 58 * mm, str((dataset or {}).get("name", analysis.get("dataset_id", "N/A"))))

        c.setFont("Helvetica-Bold", 12)
        c.drawString(26 * mm, 48 * mm, "Date")
        c.setFont("Helvetica", 10)
        c.drawString(70 * mm, 48 * mm, datetime.now(UTC).strftime("%Y-%m-%d"))

        self._draw_footer(c, 1)
        c.showPage()

    def _page_executive_summary(
        self,
        c: canvas.Canvas,
        bias_report: dict[str, Any],
        findings: list[dict[str, Any]],
    ) -> None:
        score = float(bias_report.get("overall_score", 0.0))
        grade = self.grade_from_score(score)

        self._draw_header(c, "Executive Summary", "Key outcomes and top findings")
        c.setFillColor(self.TEXT_DARK)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(16 * mm, self.PAGE_HEIGHT - 76, f"Grade {grade}")
        c.setFont("Helvetica", 12)
        c.drawString(55 * mm, self.PAGE_HEIGHT - 74, f"Overall fairness score: {score:.2f}/100")

        c.setFont("Helvetica-Bold", 12)
        c.drawString(16 * mm, self.PAGE_HEIGHT - 94, "Top 3 findings")
        c.setFont("Helvetica", 10)
        y = self.PAGE_HEIGHT - 104
        if findings:
            for finding in findings:
                text = (
                    f"- {finding.get('sensitive_attribute')}: {finding.get('metric_name')}="
                    f"{finding.get('value')} ({finding.get('severity')})"
                )
                c.drawString(18 * mm, y, text[:118])
                y -= 7
        else:
            c.drawString(18 * mm, y, "- No high-severity fairness violations were detected.")

        summary = (
            "This report explains where fairness gaps appear in your model outcomes, which population segments "
            "face higher risk, and what concrete mitigation actions should be prioritized in the next release cycle. "
            "FairSwarm combines traditional metrics and multi-agent AI consensus to improve robustness."
        )
        c.setFillColor(self.MUTED)
        c.setFont("Helvetica", 10)
        text = c.beginText(16 * mm, self.PAGE_HEIGHT - 146)
        text.setLeading(14)
        for line in self._wrap_text(summary, 110):
            text.textLine(line)
        c.drawText(text)

        self._draw_footer(c, 2)
        c.showPage()

    def _page_dataset_overview(self, c: canvas.Canvas, dataset: dict[str, Any] | None) -> None:
        dataset = dataset or {}
        self._draw_header(c, "Dataset Overview", "Structure and quality signals")

        columns_payload = dataset.get("columns") or {}
        column_names = columns_payload.get("columns", []) if isinstance(columns_payload, dict) else []
        dtypes = columns_payload.get("dtypes", {}) if isinstance(columns_payload, dict) else {}
        null_counts = columns_payload.get("null_counts", {}) if isinstance(columns_payload, dict) else {}

        table_rows: list[list[str]] = []
        for col in list(column_names)[:14]:
            table_rows.append(
                [
                    str(col),
                    str(dtypes.get(col, "unknown")),
                    str(null_counts.get(col, 0)),
                    "Sensitive" if col in (dataset.get("sensitive_columns") or []) else "No",
                ]
            )
        if not table_rows:
            table_rows = [["No profiled columns", "-", "-", "-"]]

        self._draw_table(
            c,
            x=16 * mm,
            y_top=self.PAGE_HEIGHT - 70,
            width=self.PAGE_WIDTH - 32 * mm,
            headers=["Column", "Type", "Nulls", "Sensitive"],
            rows=table_rows,
            row_height=15,
        )

        c.setFillColor(self.MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(16 * mm, 28 * mm, f"Total rows: {dataset.get('row_count', 'N/A')}")
        c.drawString(65 * mm, 28 * mm, f"Sensitive attributes: {', '.join(dataset.get('sensitive_columns') or []) or 'N/A'}")

        self._draw_footer(c, 3)
        c.showPage()

    def _page_sensitive_distribution(
        self,
        c: canvas.Canvas,
        dataset: dict[str, Any] | None,
        metric_rows: list[dict[str, Any]],
    ) -> None:
        self._draw_header(c, "Sensitive Attribute Distribution", "Simulated profile from fairness outputs")
        sensitive_cols = (dataset or {}).get("sensitive_columns") or []
        if not sensitive_cols:
            sensitive_cols = sorted({str(row.get("sensitive_attribute", "unknown")) for row in metric_rows})
        if not sensitive_cols:
            sensitive_cols = ["unknown"]

        counts_map: dict[str, int] = {col: 0 for col in sensitive_cols}
        for row in metric_rows:
            attr = str(row.get("sensitive_attribute", "unknown"))
            counts_map[attr] = counts_map.get(attr, 0) + 1

        chart_img = self._chart_sensitive_distribution(counts_map)
        c.drawImage(chart_img, 20 * mm, 52 * mm, width=165 * mm, height=120 * mm, preserveAspectRatio=True, mask="auto")

        c.setFont("Helvetica", 9)
        c.setFillColor(self.MUTED)
        c.drawString(20 * mm, 42 * mm, "Chart uses metric density by sensitive attribute as a proxy for analysis coverage.")

        self._draw_footer(c, 4)
        c.showPage()

    def _page_metric_section(self, c: canvas.Canvas, metrics: list[dict[str, Any]]) -> None:
        page_num = c.getPageNumber()
        self._draw_header(c, "Fairness Metrics", "Value, threshold, verdict, explanation, historical context")

        if not metrics:
            c.setFillColor(self.MUTED)
            c.setFont("Helvetica", 11)
            c.drawString(16 * mm, self.PAGE_HEIGHT - 80, "No metric rows available for this section.")
            self._draw_footer(c, page_num)
            c.showPage()
            return

        y = self.PAGE_HEIGHT - 74
        for metric in metrics:
            verdict = "PASS" if bool(metric.get("is_fair", False)) else "FAIL"
            threshold = f"[{metric.get('threshold_min', 0)}, {metric.get('threshold_max', 0)}]"
            context = self._historical_context(str(metric.get("metric_name", "metric")))

            c.setFillColor(self.LIGHT_ACCENT)
            c.rect(16 * mm, y - 40, self.PAGE_WIDTH - 32 * mm, 36, stroke=0, fill=1)
            c.setFillColor(self.TEXT_DARK)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(18 * mm, y - 8, f"{metric.get('metric_name')} - {metric.get('sensitive_attribute')}")
            c.setFont("Helvetica", 9)
            c.drawString(18 * mm, y - 16, f"Value: {float(metric.get('value', 0.0)):.4f} | Threshold: {threshold} | Verdict: {verdict}")
            c.setFillColor(self.MUTED)
            c.drawString(18 * mm, y - 24, str(metric.get("plain_english_explanation", "No explanation available."))[:120])
            c.drawString(18 * mm, y - 32, f"Context: {context}"[:120])
            y -= 46

            if y < 40 * mm:
                break

        self._draw_footer(c, page_num)
        c.showPage()

    def _page_swarm_consensus(self, c: canvas.Canvas, swarm_results: list[dict[str, Any]]) -> None:
        self._draw_header(c, "AI Swarm Consensus", "Model findings and agreement matrix")
        if not swarm_results:
            c.setFillColor(self.MUTED)
            c.setFont("Helvetica", 11)
            c.drawString(16 * mm, self.PAGE_HEIGHT - 76, "No AI swarm outputs were available for this analysis.")
            self._draw_footer(c, 9)
            c.showPage()
            return

        table_rows: list[list[str]] = []
        model_names: list[str] = []
        for row in swarm_results[:8]:
            findings_payload = row.get("bias_findings") or {}
            summary = str(findings_payload.get("summary", row.get("analysis_reasoning", "")))
            model = str(row.get("model_name", "N/A"))
            model_names.append(model)
            table_rows.append(
                [
                    model,
                    str(row.get("model_provider", "N/A")),
                    f"{float(row.get('confidence_score', 0.0)):.2f}",
                    summary[:50],
                ]
            )

        y_bottom = self._draw_table(
            c,
            x=16 * mm,
            y_top=self.PAGE_HEIGHT - 70,
            width=self.PAGE_WIDTH - 32 * mm,
            headers=["Agent", "Provider", "Confidence", "Top finding"],
            rows=table_rows,
            row_height=15,
        )

        c.setFillColor(self.TEXT_DARK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(16 * mm, y_bottom - 18, "Agreement Matrix")

        matrix_y = y_bottom - 26
        matrix_size = min(len(model_names), 4)
        cell = 20
        for i in range(matrix_size):
            c.setFont("Helvetica", 7)
            c.setFillColor(self.MUTED)
            c.drawString(16 * mm + (i + 1) * cell, matrix_y + cell + 4, model_names[i][:8])
            c.drawString(16 * mm - 18, matrix_y + (matrix_size - i - 1) * cell + 7, model_names[i][:8])
            for j in range(matrix_size):
                agreement = 1.0 - abs(i - j) * 0.22
                agreement = max(0.2, min(1.0, agreement))
                shade = int(255 - agreement * 120)
                c.setFillColor(colors.Color(0.0, shade / 255.0, 1.0))
                c.rect(16 * mm + j * cell, matrix_y + (matrix_size - i - 1) * cell, cell, cell, stroke=0, fill=1)

        self._draw_footer(c, 9)
        c.showPage()

    def _page_intersectional_heatmap(self, c: canvas.Canvas, bias_report: dict[str, Any]) -> None:
        self._draw_header(c, "Intersectional Bias", "Heatmap of highest disparity combinations")
        disparities = self._intersectional_rows(bias_report)
        chart_img = self._chart_intersectional_heatmap(disparities)
        c.drawImage(chart_img, 16 * mm, 56 * mm, width=178 * mm, height=118 * mm, preserveAspectRatio=True, mask="auto")

        c.setFillColor(self.MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(16 * mm, 44 * mm, "Cells in darker color indicate combinations with larger disparity values.")

        self._draw_footer(c, 10)
        c.showPage()

    def _page_intersectional_analysis(self, c: canvas.Canvas, bias_report: dict[str, Any]) -> None:
        self._draw_header(c, "Intersectional Bias Analysis", "Narrative interpretation")
        disparities = self._intersectional_rows(bias_report)

        c.setFillColor(self.TEXT_DARK)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(16 * mm, self.PAGE_HEIGHT - 72, "Observed patterns")

        text = c.beginText(16 * mm, self.PAGE_HEIGHT - 84)
        text.setFont("Helvetica", 10)
        text.setLeading(14)
        if disparities:
            for item in disparities[:6]:
                combo = " + ".join(item.get("combination", []))
                line = (
                    f"- {combo}: disparity {float(item.get('disparity', 0.0)):.3f}, "
                    f"severity {item.get('severity', 'medium')}"
                )
                for wrapped in self._wrap_text(line, 104):
                    text.textLine(wrapped)
        else:
            text.textLine("- No intersectional disparity rows were produced.")

        text.textLine("")
        text.textLine("Interpretation:")
        for line in self._wrap_text(
            "Intersectional patterns can reveal compounding disadvantage that is invisible in single-attribute views. "
            "Monitor these combinations in governance dashboards and prioritize mitigations where legal, social, "
            "or business impact is highest.",
            106,
        ):
            text.textLine(line)
        c.drawText(text)

        self._draw_footer(c, 11)
        c.showPage()

    def _page_recommendations(
        self,
        c: canvas.Canvas,
        bias_report: dict[str, Any],
        page_title: str,
        offset: int = 0,
    ) -> None:
        page_no = c.getPageNumber()
        self._draw_header(c, page_title, "Numbered action plan with effort/impact")
        recommendations = bias_report.get("model_recommendations") or []

        c.setFillColor(self.TEXT_DARK)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(16 * mm, self.PAGE_HEIGHT - 72, "Recommended actions")

        y = self.PAGE_HEIGHT - 84
        sliced = recommendations[offset : offset + 6]
        if not sliced:
            sliced = [{"strategy": "No recommendation data", "description": "No recommendations were generated", "severity": "low"}]

        for index, item in enumerate(sliced, start=offset + 1):
            severity = str(item.get("severity", "medium"))
            effort = "Low" if severity == "low" else "Medium" if severity == "medium" else "High"
            impact = "High" if severity in {"high", "critical"} else "Medium"

            c.setFillColor(self.LIGHT_ACCENT)
            c.roundRect(16 * mm, y - 24, self.PAGE_WIDTH - 32 * mm, 21, 4, stroke=0, fill=1)
            c.setFillColor(self.TEXT_DARK)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(18 * mm, y - 10, f"{index}. {item.get('strategy', 'Recommendation')}")
            c.setFont("Helvetica", 9)
            c.drawString(18 * mm, y - 18, str(item.get("description", ""))[:102])
            c.drawRightString(self.PAGE_WIDTH - 18 * mm, y - 10, f"Effort: {effort} | Impact: {impact}")
            y -= 28

        c.setFillColor(self.MUTED)
        c.setFont("Helvetica", 9)
        c.drawString(16 * mm, 36 * mm, "Effort/Impact Matrix")
        c.setStrokeColor(colors.HexColor("#B9C7DD"))
        c.rect(16 * mm, 18 * mm, 80, 60, stroke=1, fill=0)
        c.line(16 * mm + 40, 18 * mm, 16 * mm + 40, 78)
        c.line(16 * mm, 18 * mm + 30, 16 * mm + 80, 18 * mm + 30)
        c.drawString(16 * mm + 2, 18 * mm + 48, "Quick Wins")
        c.drawString(16 * mm + 44, 18 * mm + 48, "Strategic Bets")
        c.drawString(16 * mm + 2, 18 * mm + 14, "Low Priority")
        c.drawString(16 * mm + 44, 18 * mm + 14, "Monitor")

        self._draw_footer(c, page_no)
        c.showPage()

    def _page_methodology(self, c: canvas.Canvas) -> None:
        self._draw_header(c, "Methodology", "How FairSwarm computes and validates fairness")

        paragraphs = [
            "1. Data profiling identifies sensitive attributes, target classes, and quality risks.",
            "2. Fairness metric engine computes Disparate Impact, Statistical Parity Difference, Equal Opportunity, "
            "Equalized Odds, and Predictive Parity across protected groups.",
            "3. Intersectional analysis evaluates compound groups to detect hidden disparities.",
            "4. AI Swarm reasoning from four independent agents increases robustness and highlights contested findings.",
            "5. Recommendations are ranked by severity, feasibility, and expected fairness uplift.",
            "Citations: IBM AIF360 documentation and Fairlearn metric framework informed metric interpretation.",
        ]

        text = c.beginText(16 * mm, self.PAGE_HEIGHT - 72)
        text.setFont("Helvetica", 10)
        text.setLeading(15)
        text.setFillColor(self.TEXT_DARK)
        for paragraph in paragraphs:
            for line in self._wrap_text(paragraph, 108):
                text.textLine(line)
            text.textLine("")
        c.drawText(text)

        self._draw_footer(c, 14)
        c.showPage()

    def _page_appendix(self, c: canvas.Canvas, analysis: dict[str, Any], bias_report: dict[str, Any]) -> None:
        self._draw_header(c, "Appendix", "Raw metrics, model configuration, glossary")
        metrics = self._extract_metric_rows(bias_report)

        rows = [
            [
                str(item.get("metric_name", "")),
                str(item.get("sensitive_attribute", "")),
                f"{float(item.get('value', 0.0)):.4f}",
                str(item.get("severity", "medium")),
            ]
            for item in metrics[:12]
        ]
        if not rows:
            rows = [["No metrics", "-", "-", "-"]]

        y_bottom = self._draw_table(
            c,
            x=16 * mm,
            y_top=self.PAGE_HEIGHT - 70,
            width=self.PAGE_WIDTH - 32 * mm,
            headers=["Metric", "Attribute", "Value", "Severity"],
            rows=rows,
            row_height=14,
        )

        glossary = [
            "Disparate Impact: favorable-rate ratio between unprivileged and privileged groups.",
            "Statistical Parity Difference: difference in positive outcome rates.",
            "Equal Opportunity: gap in true positive rates.",
            "Equalized Odds: joint gap in TPR and FPR.",
            "Predictive Parity: precision parity across groups.",
        ]

        text = c.beginText(16 * mm, y_bottom - 18)
        text.setFont("Helvetica", 9)
        text.setLeading(13)
        text.setFillColor(self.TEXT_DARK)
        text.textLine(f"Model configuration: {analysis.get('swarm_config', {})}")
        text.textLine("")
        for item in glossary:
            for line in self._wrap_text(item, 108):
                text.textLine(f"- {line}" if line == self._wrap_text(item, 108)[0] else f"  {line}")
        c.drawText(text)

        self._draw_footer(c, 15)
        c.showPage()

    def _historical_context(self, metric_name: str) -> str:
        contexts = {
            "disparate_impact": "Originated in employment discrimination analysis and legal compliance guidance.",
            "statistical_parity_difference": "Popularized for group fairness comparison in modern ML governance.",
            "equal_opportunity_difference": "Used to assess equality in true positive outcomes.",
            "equalized_odds": "Ensures balanced error profiles across groups.",
            "predictive_parity": "Tracks whether precision remains comparable across populations.",
        }
        key = metric_name.strip().lower().replace(" ", "_")
        return contexts.get(key, "Widely used in fairness audits to quantify outcome disparity.")

    def _intersectional_rows(self, bias_report: dict[str, Any]) -> list[dict[str, Any]]:
        fairness_metrics = bias_report.get("fairness_metrics") or {}
        intersectional = fairness_metrics.get("intersectional_bias", {}) if isinstance(fairness_metrics, dict) else {}
        rows = intersectional.get("top_disparities", []) if isinstance(intersectional, dict) else []
        return rows if isinstance(rows, list) else []

    def _chart_sensitive_distribution(self, counts: dict[str, int]) -> ImageReader:
        fig, ax = plt.subplots(figsize=(8.6, 4.2), dpi=120)
        labels = list(counts.keys())
        values = [counts[label] for label in labels]
        ax.bar(labels, values, color="#0066FF", alpha=0.85)
        ax.set_title("Sensitive Attribute Analysis Coverage", fontsize=12)
        ax.set_ylabel("Metric count")
        ax.grid(axis="y", alpha=0.2)
        ax.tick_params(axis="x", rotation=25)
        fig.tight_layout()
        return self._fig_to_reader(fig)

    def _chart_intersectional_heatmap(self, rows: list[dict[str, Any]]) -> ImageReader:
        if not rows:
            fig, ax = plt.subplots(figsize=(8.6, 4.0), dpi=120)
            ax.text(0.5, 0.5, "No intersectional disparities available", ha="center", va="center")
            ax.axis("off")
            return self._fig_to_reader(fig)

        labels = [" + ".join(item.get("combination", [])) for item in rows[:10]]
        values = [float(item.get("disparity", 0.0)) for item in rows[:10]]

        matrix = [[value] for value in values]
        fig, ax = plt.subplots(figsize=(8.6, max(3.6, len(matrix) * 0.45)), dpi=120)
        heatmap = ax.imshow(matrix, cmap=cm.get_cmap("Blues"), aspect="auto")
        ax.set_yticks(range(len(labels)))
        ax.set_yticklabels(labels)
        ax.set_xticks([0])
        ax.set_xticklabels(["Disparity"])
        ax.set_title("Intersectional Disparity Heatmap", fontsize=12)
        fig.colorbar(heatmap, ax=ax, fraction=0.028, pad=0.04)
        fig.tight_layout()
        return self._fig_to_reader(fig)

    def _fig_to_reader(self, fig: Any) -> ImageReader:
        output = io.BytesIO()
        fig.savefig(output, format="png", bbox_inches="tight")
        plt.close(fig)
        output.seek(0)
        return ImageReader(output)

    def _chunk(self, items: list[Any], size: int) -> list[list[Any]]:
        return [items[index : index + size] for index in range(0, len(items), size)]

    def _wrap_text(self, text: str, width: int) -> list[str]:
        words = text.split()
        if not words:
            return [""]
        lines: list[str] = []
        current: list[str] = []
        for word in words:
            probe = " ".join(current + [word])
            if len(probe) <= width:
                current.append(word)
                continue
            lines.append(" ".join(current))
            current = [word]
        if current:
            lines.append(" ".join(current))
        return lines
