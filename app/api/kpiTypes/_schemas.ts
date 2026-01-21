import { z } from "zod";

const QuantRubricSchema = z.object({
	kind: z.literal("QUANTITATIVE_1_TO_5"),
	levels: z
		.array(
			z.object({
				score: z.number().int().min(1).max(5),
				value: z.number(),
				unit: z.string().optional().nullable(),
			})
		)
		.min(1),
});

const QualRubricSchema = z.object({
	kind: z.literal("QUALITATIVE_CHECKLIST"),
	checklist: z
		.array(
			z.object({
				item: z.string().min(1),
				weight_percent: z.number().min(0).max(100),
			})
		)
		.min(1),
});

const CustomRubricSchema = z.object({
	kind: z.literal("CUSTOM_DESCRIPTION_1_TO_5"),
	levels: z
		.array(
			z.object({
				score: z.number().int().min(1).max(5),
				desc: z.string().min(1),
			})
		)
		.min(1),
});

export const RubricSchema = z.union([QuantRubricSchema, QualRubricSchema, CustomRubricSchema]);

type KpiTypeChoice = "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM";

function round2(n: number) {
	return Math.round(n * 100) / 100;
}

function strictRubricChecks(rubric: any, ctx: z.RefinementCtx) {
	if (!rubric) return;
  
	if (rubric.kind === "QUALITATIVE_CHECKLIST") {
		const sum = round2(
			(rubric.checklist ?? []).reduce((s: number, x: any) => s + Number(x.weight_percent ?? 0), 0)
		);
		if (sum !== 100) {
			ctx.addIssue({
				code: "custom",
				path: ["rubric", "checklist"],
				message: `checklist weights must sum to 100 (got ${sum})`,
			});
		}
	}
  
	if (rubric.kind === "QUANTITATIVE_1_TO_5" || rubric.kind === "CUSTOM_DESCRIPTION_1_TO_5") {
		const levels = rubric.levels ?? [];
		const scores = levels.map((x: any) => x.score);
		const unique = new Set(scores);
		if (unique.size !== scores.length) {
			ctx.addIssue({
				code: "custom",
				path: ["rubric", "levels"],
				message: "duplicate score in levels",
			});
		}
	}
}

function kindMatchesType(type: KpiTypeChoice, kind: string) {
	if (type === "QUANTITATIVE") return kind === "QUANTITATIVE_1_TO_5";
	if (type === "QUALITATIVE") return kind === "QUALITATIVE_CHECKLIST";
	if (type === "CUSTOM") return kind === "CUSTOM_DESCRIPTION_1_TO_5";
	return false;
}

export function makeKpiTypeCreateSchema() {
	return z
		.object({
			type: z.enum(["QUANTITATIVE", "QUALITATIVE", "CUSTOM"]),
			name: z.string().min(1).max(255),
			rubric: RubricSchema,
		})
		.superRefine((v, ctx) => {
			if (!kindMatchesType(v.type, v.rubric.kind)) {
				ctx.addIssue({
					code: "custom",
					path: ["rubric", "kind"],
					message: `rubric.kind mismatch for ${v.type}`,
				});
			}
			strictRubricChecks(v.rubric, ctx);
		});
  }

/**
 * PATCH: can change type
 * Rules:
 * - ต้องมีอย่างน้อย 1 field ใน (name/type/rubric)
 * - ถ้าส่ง type ใหม่ -> ต้องส่ง rubric มาด้วย
 * - ถ้าส่ง rubric -> rubric.kind ต้อง match "type ที่จะเป็นหลัง patch"
 *   (type ใหม่ถ้ามี ไม่งั้นใช้ existingType)
 * - strict rubric checks เหมือน POST
 */
export function makeKpiTypePatchSchema(existingType: KpiTypeChoice) {
	return z
		.object({
			name: z.string().min(1).max(255).optional(),
			type: z.enum(["QUANTITATIVE", "QUALITATIVE", "CUSTOM"]).optional(),
			rubric: RubricSchema.optional(),
		})
		.superRefine((v, ctx) => {
			const hasAny = v.name !== undefined || v.type !== undefined || v.rubric !== undefined;
			if (!hasAny) {
				ctx.addIssue({ code: "custom", path: [], message: "At least one field is required" });
				return;
			}
	
			const nextType: KpiTypeChoice = (v.type ?? existingType) as KpiTypeChoice;
	
			// if type changed, must have new rubric
			if (v.type !== undefined && v.type !== existingType) {
				if (!v.rubric) {
					ctx.addIssue({
						code: "custom",
						path: ["rubric"],
						message: "rubric is required when changing type",
					});
					return;
				}
			}
	
			// new rubric must match with new type
			if (v.rubric) {
				if (!kindMatchesType(nextType, v.rubric.kind)) {
					ctx.addIssue({
						code: "custom",
						path: ["rubric", "kind"],
						message: `rubric.kind mismatch for ${nextType}`,
					});
				}
				strictRubricChecks(v.rubric, ctx);
			}
		});
}