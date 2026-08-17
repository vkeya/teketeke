"use client";

import { useEffect, useState } from "react";
import ExecutiveBriefing from "./ExecutiveBriefing";
import { buildBusinessContext } from "../../lib/ai/businessContext";
import {
  getUploadedAnalysis,
  type UploadedAnalysis,
} from "../../lib/analysisStorage";

export default function ExecutiveBriefingContainer() {
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
    <ExecutiveBriefing context={context} />
  );
}