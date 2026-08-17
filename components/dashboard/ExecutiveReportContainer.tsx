"use client";

import { useEffect, useState } from "react";
import ExecutiveReport from "./ExecutiveReport";
import { buildBusinessContext } from "../../lib/ai/businessContext";
import {
  getUploadedAnalysis,
  type UploadedAnalysis,
} from "../../lib/analysisStorage";

/**
 * Dashboard-safe wrapper for the executive report.
 *
 * Browser storage access stays here so ExecutiveReport remains a
 * pure presentation component driven by BusinessContext.
 */
export default function ExecutiveReportContainer() {
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
    <ExecutiveReport context={context} />
  );
}