from __future__ import annotations

from typing import Any

import pandas as pd

from .dataset_processor import DatasetProcessor
from .fairness_metrics import FairnessMetricsEngine


class BiasDetectorService:
    def __init__(self) -> None:
        self.processor = DatasetProcessor()
        self.metrics_engine = FairnessMetricsEngine()

    def analyze(
        self,
        df: pd.DataFrame,
        sensitive_columns: list[str],
        target_column: str,
    ) -> dict[str, Any]:
        dataset, encoding_metadata = self.processor.encode_for_analysis(
            df=df,
            sensitive_cols=sensitive_columns,
            target_col=target_column,
        )

        metrics_by_attribute: dict[str, Any] = {}
        for sensitive_attr in sensitive_columns:
            metrics = self.metrics_engine.compute_all_metrics(dataset, sensitive_attr)
            metrics_by_attribute[sensitive_attr] = metrics.model_dump()

        intersectional = self.metrics_engine.compute_intersectional_bias(
            df=df,
            sensitive_cols=sensitive_columns,
            target_col=target_column,
        )

        fairness_scores = [
            float(item.get("fairness_score", 0.0))
            for item in metrics_by_attribute.values()
            if isinstance(item, dict)
        ]
        overall_score = round(sum(fairness_scores) / max(len(fairness_scores), 1), 2)

        return {
            "metrics_by_sensitive_attribute": metrics_by_attribute,
            "intersectional_bias": intersectional,
            "overall_fairness_score": overall_score,
            "encoding_metadata": encoding_metadata,
        }
