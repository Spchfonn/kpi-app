import type { TabKey } from "@/components/admin/EvaluationCycleMenuBar";
import type { EvaluationGroup } from "@/components/admin/EvaluationPairsTable";
import { StatusKey } from "@/components/SystemStatusCards";

export type EditMode = "view" | "edit";

export type EvalCycleForm = {
  name: string;
  startDate: string;
  endDate: string;
  systemStatus: StatusKey;
};

export type { TabKey, EvaluationGroup, StatusKey };