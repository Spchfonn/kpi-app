export type Gate = "DEFINE" | "EVALUATE" | "SUMMARY";
export type CycleGates = Record<Gate, boolean>;

export type KpiDefineMode =
	| "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS"
	| "EVALUATEE_DEFINES_EVALUATOR_APPROVES";

export type DraftNodeInput = {
	tempId: string;
	parentTempId: string | null;
	nodeType: "GROUP" | "ITEM";
	title: string;
	description?: string | null;
	weightPercent: string | number; // Decimal(5,2)
	typeId?: string | null;
	unit?: string | null;
	startDate?: string | null; // ISO
	endDate?: string | null;   // ISO
	sortOrder?: number;
};