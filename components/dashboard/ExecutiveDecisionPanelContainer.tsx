"use client";

import { useEffect, useState } from "react";
import ExecutiveDecisionPanel from "./ExecutiveDecisionPanel";
import { buildBusinessContext } from "../../lib/ai/businessContext";
import {
  getUploadedAnalysis,
  type UploadedAnalysis,
} from "../../lib/analysisStorage";

/**
 * Dashboard-safe wrapper for ExecutiveDecisionPanel.
 *
 * The wrapper owns browser/local-storage access so the presentation
 * component stays focused on rendering business decisions.
 */
export default function ExecutiveDecisionPanelContainer() {
  const [analysis, setAnalysis] =
    useState<UploadedAnalysis | null>(null);

  useEffect(() => {
    setAnalysis(getUploadedAnalysis());
  }, []);

  if (!analysis) {
    return null;
  }

  const context = buildBusinessContext(analysis);

  return (
    <ExecutiveDecisionPanel context={context} />
  );
}