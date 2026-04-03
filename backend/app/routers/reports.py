from __future__ import annotations

import io
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from ..core.database import extract_list, extract_single, get_supabase_client
from ..core.security import get_current_user

router = APIRouter()


def _fetch_analysis_bundle(analysis_id: str, user_id: str) -> dict[str, Any]:
	supabase = get_supabase_client()

	analysis_result = (
		supabase.table("analyses")
		.select("*")
		.eq("id", analysis_id)
		.eq("user_id", user_id)
		.limit(1)
		.execute()
	)
	analysis = extract_single(analysis_result)
	if analysis is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

	report_result = (
		supabase.table("bias_reports")
		.select("*")
		.eq("analysis_id", analysis_id)
		.order("created_at", desc=True)
		.limit(1)
		.execute()
	)
	report = extract_single(report_result)
	if report is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

	dataset_result = (
		supabase.table("datasets")
		.select("id,name,row_count,columns,sensitive_columns")
		.eq("id", analysis["dataset_id"])
		.limit(1)
		.execute()
	)
	dataset = extract_single(dataset_result)

	swarm_result = (
		supabase.table("ai_swarm_results")
		.select("*")
		.eq("analysis_id", analysis_id)
		.order("created_at", desc=False)
		.execute()
	)

	return {
		"analysis": analysis,
		"report": report,
		"dataset": dataset,
		"swarm_results": extract_list(swarm_result),
	}


def _extract_metric_rows(report: dict[str, Any]) -> list[dict[str, Any]]:
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


def _top_findings(metric_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
	severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
	biased = [row for row in metric_rows if not bool(row.get("is_fair", False))]
	sorted_rows = sorted(
		biased,
		key=lambda row: severity_order.get(str(row.get("severity", "low")), 0),
		reverse=True,
	)
	return sorted_rows[:3]


def _metric_bar(metric_value: float, threshold_min: float, threshold_max: float) -> Drawing:
	width = 120.0
	height = 10.0
	drawing = Drawing(width + 40, 20)
	drawing.add(Rect(0, 5, width, height, fillColor=colors.HexColor("#E5E7EB"), strokeWidth=0))

	min_display = min(threshold_min, metric_value, 0.0)
	max_display = max(threshold_max, metric_value, 1.0)
	span = max(max_display - min_display, 1e-6)
	position = (metric_value - min_display) / span
	position = max(0.0, min(1.0, position))

	drawing.add(Rect(position * width - 1.5, 3, 3, height + 4, fillColor=colors.HexColor("#0F766E"), strokeWidth=0))
	drawing.add(String(125, 7, f"{metric_value:.3f}", fontSize=8, fillColor=colors.black))
	return drawing


def _build_pdf(bundle: dict[str, Any]) -> bytes:
	analysis = bundle["analysis"]
	report = bundle["report"]
	dataset = bundle.get("dataset") or {}
	swarm_results = bundle.get("swarm_results", [])

	metric_rows = _extract_metric_rows(report)
	findings = _top_findings(metric_rows)
	fairness_metrics_payload = report.get("fairness_metrics") or {}
	intersectional = fairness_metrics_payload.get("intersectional_bias", {})

	styles = getSampleStyleSheet()
	styles.add(ParagraphStyle(name="TitleBrand", parent=styles["Title"], textColor=colors.HexColor("#0F172A")))
	styles.add(ParagraphStyle(name="Section", parent=styles["Heading2"], textColor=colors.HexColor("#0F766E")))

	buffer = io.BytesIO()
	document = SimpleDocTemplate(
		buffer,
		pagesize=A4,
		leftMargin=16 * mm,
		rightMargin=16 * mm,
		topMargin=16 * mm,
		bottomMargin=16 * mm,
	)
	story: list[Any] = []

	story.append(Paragraph("FairSwarm Bias Assessment Report", styles["TitleBrand"]))
	story.append(Spacer(1, 8))
	story.append(Paragraph("Swarm Intelligence Fairness Analysis", styles["Heading3"]))
	story.append(Spacer(1, 16))

	cover_table = Table(
		[
			["Analysis ID", str(analysis.get("id"))],
			["Dataset ID", str(analysis.get("dataset_id"))],
			["Generated", datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")],
			["Status", str(analysis.get("status", "unknown"))],
		],
		colWidths=[90 * mm, 80 * mm],
	)
	cover_table.setStyle(
		TableStyle(
			[
				("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
				("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
				("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
				("FONTSIZE", (0, 0), (-1, -1), 10),
			]
		)
	)
	story.append(cover_table)
	story.append(PageBreak())

	story.append(Paragraph("Executive Summary", styles["Section"]))
	story.append(Spacer(1, 6))
	story.append(
		Paragraph(
			f"Overall Fairness Score: <b>{float(report.get('overall_score', 0.0)):.2f}/100</b>",
			styles["BodyText"],
		)
	)
	story.append(Spacer(1, 6))
	for finding in findings:
		story.append(
			Paragraph(
				f"- {finding.get('sensitive_attribute')} | {finding.get('metric_name')}: "
				f"{finding.get('value')} ({finding.get('severity')})",
				styles["BodyText"],
			)
		)

	if not findings:
		story.append(Paragraph("- No high-risk fairness violations detected.", styles["BodyText"]))

	story.append(Spacer(1, 12))
	story.append(Paragraph("Dataset Overview", styles["Section"]))
	story.append(Spacer(1, 4))
	dataset_rows = [
		["Dataset Name", str(dataset.get("name", "N/A"))],
		["Rows", str(dataset.get("row_count", "N/A"))],
		["Sensitive Attributes", ", ".join(dataset.get("sensitive_columns") or []) or "N/A"],
	]
	dataset_table = Table(dataset_rows, colWidths=[90 * mm, 80 * mm])
	dataset_table.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1"))]))
	story.append(dataset_table)

	story.append(Spacer(1, 12))
	story.append(Paragraph("Fairness Metrics", styles["Section"]))
	story.append(Spacer(1, 4))
	for metric in metric_rows:
		indicator = "Fair" if metric.get("is_fair") else "Biased"
		story.append(
			Paragraph(
				f"{metric.get('sensitive_attribute')} | {metric.get('metric_name')} "
				f"({indicator}) threshold [{metric.get('threshold_min')}, {metric.get('threshold_max')}], "
				f"severity {metric.get('severity')}",
				styles["BodyText"],
			)
		)
		story.append(
			_metric_bar(
				float(metric.get("value", 0.0)),
				float(metric.get("threshold_min", 0.0)),
				float(metric.get("threshold_max", 1.0)),
			)
		)

	story.append(PageBreak())
	story.append(Paragraph("AI Swarm Consensus", styles["Section"]))
	story.append(Spacer(1, 4))
	if swarm_results:
		swarm_table_data = [["Model", "Provider", "Confidence", "Finding"]]
		for row in swarm_results:
			findings_payload = row.get("bias_findings") or {}
			swarm_table_data.append(
				[
					str(row.get("model_name", "N/A")),
					str(row.get("model_provider", "N/A")),
					f"{float(row.get('confidence_score', 0.0)):.2f}",
					str(findings_payload.get("summary", "N/A")),
				]
			)
		swarm_table = Table(swarm_table_data, colWidths=[35 * mm, 25 * mm, 20 * mm, 100 * mm])
		swarm_table.setStyle(
			TableStyle(
				[
					("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DBEAFE")),
					("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#94A3B8")),
					("FONTSIZE", (0, 0), (-1, -1), 9),
				]
			)
		)
		story.append(swarm_table)
	else:
		story.append(Paragraph("No AI swarm results are available yet.", styles["BodyText"]))

	story.append(Spacer(1, 12))
	story.append(Paragraph("Intersectional Bias", styles["Section"]))
	story.append(Spacer(1, 4))
	top_disparities = intersectional.get("top_disparities", []) if isinstance(intersectional, dict) else []
	if top_disparities:
		heatmap_rows = [["Sensitive Combo", "Groups", "Disparity", "Severity"]]
		for entry in top_disparities:
			heatmap_rows.append(
				[
					", ".join(entry.get("combination", [])),
					str(entry.get("group_count", 0)),
					f"{float(entry.get('disparity', 0.0)):.3f}",
					str(entry.get("severity", "low")),
				]
			)
		heatmap_table = Table(heatmap_rows, colWidths=[70 * mm, 20 * mm, 25 * mm, 25 * mm])
		heatmap_table.setStyle(
			TableStyle(
				[
					("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#FEF3C7")),
					("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D1D5DB")),
				]
			)
		)
		story.append(heatmap_table)
	else:
		story.append(Paragraph("No intersectional disparity findings were generated.", styles["BodyText"]))

	story.append(Spacer(1, 12))
	story.append(Paragraph("Mitigation Recommendations", styles["Section"]))
	story.append(Spacer(1, 4))
	recommendations = report.get("model_recommendations") or []
	if recommendations:
		for recommendation in recommendations:
			story.append(
				Paragraph(
					f"- [{recommendation.get('severity', 'medium')}] {recommendation.get('strategy')}: "
					f"{recommendation.get('description')}",
					styles["BodyText"],
				)
			)
	else:
		story.append(Paragraph("No mitigation recommendations recorded.", styles["BodyText"]))

	story.append(Spacer(1, 12))
	story.append(Paragraph("Glossary", styles["Section"]))
	glossary_rows = [
		["Disparate Impact", "Ratio of favorable outcomes for unprivileged vs privileged groups."],
		["Statistical Parity", "Difference in positive outcome rates between groups."],
		["Equal Opportunity", "Difference in true positive rates across groups."],
		["Equalized Odds", "Difference across both true positive and false positive rates."],
		["Predictive Parity", "Difference in precision across protected groups."],
	]
	glossary_table = Table(glossary_rows, colWidths=[50 * mm, 120 * mm])
	glossary_table.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1"))]))
	story.append(glossary_table)

	document.build(story)
	return buffer.getvalue()


@router.get("/{analysis_id}/pdf")
async def get_pdf_report(
	analysis_id: str,
	current_user: dict[str, Any] = Depends(get_current_user),
) -> StreamingResponse:
	try:
		bundle = _fetch_analysis_bundle(analysis_id, current_user["id"])
		pdf_bytes = _build_pdf(bundle)
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=f"Unable to generate PDF report: {exc}",
		) from exc

	filename = f"fairswarm-report-{analysis_id}.pdf"
	return StreamingResponse(
		io.BytesIO(pdf_bytes),
		media_type="application/pdf",
		headers={"Content-Disposition": f"attachment; filename={filename}"},
	)


@router.get("/{analysis_id}/json")
async def get_json_report(
	analysis_id: str,
	current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
	try:
		bundle = _fetch_analysis_bundle(analysis_id, current_user["id"])
	except HTTPException:
		raise
	except Exception as exc:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Unable to fetch report JSON.",
		) from exc

	metric_rows = _extract_metric_rows(bundle["report"])
	return {
		"generated_at": datetime.now(UTC).isoformat(),
		"analysis": bundle["analysis"],
		"dataset": bundle.get("dataset"),
		"report": bundle["report"],
		"swarm_results": bundle["swarm_results"],
		"top_findings": _top_findings(metric_rows),
	}


@router.get("/")
async def list_reports(
	page: int = Query(default=1, ge=1),
	page_size: int = Query(default=20, ge=1, le=50),
	current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
	offset = (page - 1) * page_size
	supabase = get_supabase_client()

	try:
		analyses_result = (
			supabase.table("analyses")
			.select("id", count="exact")
			.eq("user_id", current_user["id"])
			.order("created_at", desc=True)
			.range(offset, offset + page_size - 1)
			.execute()
		)
		analysis_rows = extract_list(analyses_result)
		analysis_ids = [str(row["id"]) for row in analysis_rows]
		if not analysis_ids:
			return {"items": [], "page": page, "page_size": page_size, "total": 0}

		reports_result = (
			supabase.table("bias_reports")
			.select("id,analysis_id,overall_score,sensitive_attribute,created_at")
			.in_("analysis_id", analysis_ids)
			.order("created_at", desc=True)
			.execute()
		)
	except Exception as exc:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Unable to list reports.",
		) from exc

	return {
		"items": extract_list(reports_result),
		"page": page,
		"page_size": page_size,
		"total": int(getattr(analyses_result, "count", 0) or 0),
	}
