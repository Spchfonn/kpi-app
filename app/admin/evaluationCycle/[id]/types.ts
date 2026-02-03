import type { TabKey } from "@/components/admin/EvaluationCycleMenuBar";
import type { EvaluationGroup } from "@/components/admin/EvaluationPairsTable";
import { StatusKey } from "@/components/SystemStatusCards";
import { KpiLevelMode } from "@prisma/client";

export type EditMode = "view" | "edit";

export type KpiDefineMode = "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS" | "EVALUATEE_DEFINES_EVALUATOR_APPROVES";

export type EvalCycleForm = {
  name: string;
  year: number;
  round: number;
  startDate: string;
  endDate: string;
  systemStatus: StatusKey;
  kpiDefineMode: KpiDefineMode;
  kpiLevelMode: KpiLevelMode;
  gates: { DEFINE: boolean; EVALUATE: boolean; SUMMARY: boolean };
};

export type { TabKey, EvaluationGroup, StatusKey };