from __future__ import annotations

from itertools import combinations
from typing import Any

import numpy as np
import pandas as pd
from aif360.datasets import BinaryLabelDataset
from aif360.metrics import BinaryLabelDatasetMetric, ClassificationMetric
from fairlearn.metrics import MetricFrame, demographic_parity_difference, equalized_odds_difference
from pydantic import BaseModel, Field
from sklearn.metrics import precision_score


class FairnessMetricItem(BaseModel):
    metric_name: str
    value: float
    threshold_min: float
    threshold_max: float
    is_fair: bool
    severity: str
    plain_english_explanation: str


class FairnessMetricsResult(BaseModel):
    sensitive_attribute: str
    metrics: list[FairnessMetricItem] = Field(default_factory=list)
    fairness_score: float
    biased_metrics: list[str] = Field(default_factory=list)
    mitigations: list[dict[str, str]] = Field(default_factory=list)


class FairnessMetricsEngine:
    def compute_all_metrics(
        self,
        dataset: BinaryLabelDataset,
        sensitive_attr: str,
    ) -> FairnessMetricsResult:
        if sensitive_attr not in dataset.protected_attribute_names:
            raise ValueError(f"Sensitive attribute '{sensitive_attr}' does not exist in dataset.")

        attr_index = dataset.protected_attribute_names.index(sensitive_attr)
        privileged_value = float(dataset.privileged_protected_attributes[attr_index][0])
        unprivileged_value = float(dataset.unprivileged_protected_attributes[attr_index][0])

        unprivileged_groups = [{sensitive_attr: unprivileged_value}]
        privileged_groups = [{sensitive_attr: privileged_value}]

        dataset_metric = BinaryLabelDatasetMetric(
            dataset,
            unprivileged_groups=unprivileged_groups,
            privileged_groups=privileged_groups,
        )
        classification_metric = ClassificationMetric(
            dataset,
            dataset,
            unprivileged_groups=unprivileged_groups,
            privileged_groups=privileged_groups,
        )

        y_true = dataset.labels.ravel().astype(int)
        y_pred = dataset.labels.ravel().astype(int)
        sensitive_features = dataset.protected_attributes[:, attr_index]

        metrics: list[FairnessMetricItem] = [
            self._build_metric(
                metric_name="Disparate Impact Ratio",
                value=float(dataset_metric.disparate_impact()),
                threshold_min=0.8,
                threshold_max=1.25,
                explanation="Compares favorable outcome rates between unprivileged and privileged groups.",
            ),
            self._build_metric(
                metric_name="Statistical Parity Difference",
                value=float(dataset_metric.statistical_parity_difference()),
                threshold_min=-0.1,
                threshold_max=0.1,
                explanation="Measures the gap in selection rates across groups.",
            ),
            self._build_metric(
                metric_name="Equal Opportunity Difference",
                value=float(classification_metric.equal_opportunity_difference()),
                threshold_min=-0.1,
                threshold_max=0.1,
                explanation="Compares true positive rates across groups.",
            ),
            self._build_metric(
                metric_name="Average Odds Difference",
                value=float(classification_metric.average_odds_difference()),
                threshold_min=-0.1,
                threshold_max=0.1,
                explanation="Averages TPR and FPR gaps between groups.",
            ),
            self._build_metric(
                metric_name="Theil Index",
                value=float(classification_metric.theil_index()),
                threshold_min=0.0,
                threshold_max=0.2,
                explanation="Individual fairness concentration metric. Higher values indicate inequality.",
            ),
            self._build_metric(
                metric_name="Demographic Parity Difference",
                value=float(
                    demographic_parity_difference(
                        y_true=y_true,
                        y_pred=y_pred,
                        sensitive_features=sensitive_features,
                    )
                ),
                threshold_min=0.0,
                threshold_max=0.1,
                explanation="Measures the largest disparity in positive prediction rates.",
            ),
            self._build_metric(
                metric_name="Equalized Odds Difference",
                value=float(
                    equalized_odds_difference(
                        y_true=y_true,
                        y_pred=y_pred,
                        sensitive_features=sensitive_features,
                    )
                ),
                threshold_min=0.0,
                threshold_max=0.1,
                explanation="Measures largest disparity in both TPR and FPR.",
            ),
            self._build_metric(
                metric_name="Predictive Parity",
                value=float(self._predictive_parity_difference(y_true, y_pred, sensitive_features)),
                threshold_min=0.0,
                threshold_max=0.1,
                explanation="Compares precision parity among groups.",
            ),
        ]

        result = FairnessMetricsResult(
            sensitive_attribute=sensitive_attr,
            metrics=metrics,
            fairness_score=0.0,
            biased_metrics=[metric.metric_name for metric in metrics if not metric.is_fair],
            mitigations=[],
        )
        result.fairness_score = self.generate_fairness_score(result)
        result.mitigations = self.suggest_mitigations(result)
        return result

    def compute_intersectional_bias(
        self,
        df: pd.DataFrame,
        sensitive_cols: list[str],
        target_col: str,
    ) -> dict[str, Any]:
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found.")

        valid_sensitive_cols = [column for column in sensitive_cols if column in df.columns]
        results: list[dict[str, Any]] = []

        for size in range(2, min(3, len(valid_sensitive_cols)) + 1):
            for combo in combinations(valid_sensitive_cols, size):
                grouped = (
                    df[list(combo) + [target_col]]
                    .dropna()
                    .groupby(list(combo))[target_col]
                    .agg(["count", "mean"])
                    .rename(columns={"mean": "positive_rate"})
                    .reset_index()
                )
                if grouped.empty:
                    continue

                max_rate = float(grouped["positive_rate"].max())
                min_rate = float(grouped["positive_rate"].min())
                disparity = max_rate - min_rate

                records = grouped.replace({np.nan: None}).to_dict(orient="records")
                results.append(
                    {
                        "combination": list(combo),
                        "group_count": int(len(grouped)),
                        "max_positive_rate": max_rate,
                        "min_positive_rate": min_rate,
                        "disparity": disparity,
                        "severity": self._severity_for_difference(disparity, 0.1),
                        "groups": records,
                    }
                )

        sorted_results = sorted(results, key=lambda item: item["disparity"], reverse=True)
        return {
            "intersectional_metrics": sorted_results,
            "top_disparities": sorted_results[:5],
            "combination_count": len(sorted_results),
        }

    def generate_fairness_score(self, metrics_result: FairnessMetricsResult) -> float:
        weights = {
            "Disparate Impact Ratio": 0.18,
            "Statistical Parity Difference": 0.16,
            "Equal Opportunity Difference": 0.16,
            "Average Odds Difference": 0.12,
            "Theil Index": 0.10,
            "Demographic Parity Difference": 0.10,
            "Equalized Odds Difference": 0.10,
            "Predictive Parity": 0.08,
        }

        weighted_total = 0.0
        for metric in metrics_result.metrics:
            weight = weights.get(metric.metric_name, 0.1)
            component_score = self._metric_score(metric)
            weighted_total += weight * component_score

        score = max(0.0, min(1.0, weighted_total)) * 100.0
        return round(score, 2)

    def suggest_mitigations(self, metrics_result: FairnessMetricsResult) -> list[dict[str, str]]:
        mitigation_map = {
            "Disparate Impact Ratio": {
                "strategy": "Disparate Impact Remover",
                "description": "Apply feature repair preprocessing to reduce disparate impact before training.",
            },
            "Statistical Parity Difference": {
                "strategy": "Reweighing",
                "description": "Use AIF360 reweighing to balance protected groups in training data.",
            },
            "Equal Opportunity Difference": {
                "strategy": "Calibrated Equalized Odds",
                "description": "Post-process outputs to reduce true positive disparities between groups.",
            },
            "Average Odds Difference": {
                "strategy": "Adversarial Debiasing",
                "description": "Train model with adversarial objective to minimize protected attribute leakage.",
            },
            "Theil Index": {
                "strategy": "Resampling",
                "description": "Apply under/over-sampling to reduce individual-level prediction inequality.",
            },
            "Demographic Parity Difference": {
                "strategy": "Reweighing",
                "description": "Adjust sample weights to align positive outcome rates across groups.",
            },
            "Equalized Odds Difference": {
                "strategy": "Equalized Odds Post-processing",
                "description": "Calibrate decision thresholds separately by group to reduce error-rate gaps.",
            },
            "Predictive Parity": {
                "strategy": "Threshold Optimization",
                "description": "Tune classification thresholds by group to equalize precision.",
            },
        }

        suggestions: list[dict[str, str]] = []
        for metric in metrics_result.metrics:
            if metric.is_fair:
                continue
            mitigation = mitigation_map.get(metric.metric_name)
            if mitigation is None:
                continue
            suggestions.append(
                {
                    "metric": metric.metric_name,
                    "severity": metric.severity,
                    "strategy": mitigation["strategy"],
                    "description": mitigation["description"],
                }
            )

        return suggestions

    def _build_metric(
        self,
        metric_name: str,
        value: float,
        threshold_min: float,
        threshold_max: float,
        explanation: str,
    ) -> FairnessMetricItem:
        is_fair = threshold_min <= value <= threshold_max
        if metric_name == "Disparate Impact Ratio":
            severity = self._severity_for_ratio(value, threshold_min, threshold_max)
        elif threshold_min < 0:
            severity = self._severity_for_signed_difference(value, threshold_min, threshold_max)
        else:
            severity = self._severity_for_difference(value, threshold_max)

        return FairnessMetricItem(
            metric_name=metric_name,
            value=round(value, 6),
            threshold_min=threshold_min,
            threshold_max=threshold_max,
            is_fair=is_fair,
            severity=severity,
            plain_english_explanation=explanation,
        )

    def _metric_score(self, metric: FairnessMetricItem) -> float:
        value = metric.value
        if metric.metric_name == "Disparate Impact Ratio":
            if metric.threshold_min <= value <= metric.threshold_max:
                return 1.0
            if value < metric.threshold_min:
                distance = (metric.threshold_min - value) / metric.threshold_min
            else:
                distance = (value - metric.threshold_max) / metric.threshold_max
            return max(0.0, 1.0 - (distance * 2.0))

        if metric.threshold_min < 0:
            if metric.threshold_min <= value <= metric.threshold_max:
                return 1.0
            nearest_bound = metric.threshold_min if value < metric.threshold_min else metric.threshold_max
            max_abs = max(abs(metric.threshold_min), abs(metric.threshold_max), 1e-6)
            distance = abs(value - nearest_bound) / max_abs
            return max(0.0, 1.0 - (distance * 1.8))

        if metric.threshold_min <= value <= metric.threshold_max:
            return 1.0

        distance = (value - metric.threshold_max) / max(metric.threshold_max, 1e-6)
        return max(0.0, 1.0 - (distance * 1.5))

    def _severity_for_ratio(self, value: float, threshold_min: float, threshold_max: float) -> str:
        if threshold_min <= value <= threshold_max:
            return "low"
        if value < threshold_min:
            relative_distance = (threshold_min - value) / threshold_min
        else:
            relative_distance = (value - threshold_max) / threshold_max
        return self._scale_severity(relative_distance)

    def _severity_for_signed_difference(self, value: float, threshold_min: float, threshold_max: float) -> str:
        if threshold_min <= value <= threshold_max:
            return "low"
        nearest = threshold_min if value < threshold_min else threshold_max
        relative_distance = abs(value - nearest) / max(abs(threshold_max), 1e-6)
        return self._scale_severity(relative_distance)

    def _severity_for_difference(self, value: float, threshold_max: float) -> str:
        if value <= threshold_max:
            return "low"
        relative_distance = (value - threshold_max) / max(threshold_max, 1e-6)
        return self._scale_severity(relative_distance)

    def _scale_severity(self, relative_distance: float) -> str:
        if relative_distance <= 0.25:
            return "medium"
        if relative_distance <= 0.75:
            return "high"
        return "critical"

    def _predictive_parity_difference(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        sensitive_features: np.ndarray,
    ) -> float:
        metric_frame = MetricFrame(
            metrics=lambda yt, yp: precision_score(yt, yp, zero_division=0),
            y_true=y_true,
            y_pred=y_pred,
            sensitive_features=sensitive_features,
        )
        values = [float(item) for item in metric_frame.by_group.values if pd.notna(item)]
        if not values:
            return 0.0
        return float(max(values) - min(values))
