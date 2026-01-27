import { prisma } from "@/prisma/client";
import { PrefixName } from "@prisma/client";

type Scope = "EVALUATEE_SELF" | "SAME_LINE_HIGHER" | "OTHER_EVALUATEES";

const PREFIX_TH: Record<PrefixName, string> = {
	MR: "นาย",
	MRS: "นาง",
	MS: "นางสาว",
  };
  
type OwnerRow = {
	id: string;
	employeeNo: string;
	prefixName: PrefixName;
	name: string;
	lastName: string;
	position?: { name: string } | null;
	level?: { name: string } | null;
	organization?: { name: string } | null;
};

function bad(message: string, status = 400) {
	return Response.json({ ok: false, message }, { status });
}

function mapOwner(e: OwnerRow) {
	return {
		employeeId: e.id,
		employeeNo: e.employeeNo,
		fullNameTh: `${PREFIX_TH[e.prefixName]}${e.name} ${e.lastName}`.trim(),
		position: e.position?.name ?? "",
		level: e.level?.name ?? "",
		organization: e.organization?.name ?? "",
	};
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);

		const cyclePublicId = searchParams.get("cyclePublicId") || "";
		const evaluatorId = searchParams.get("evaluatorId") || "";
		const evaluateeId = searchParams.get("evaluateeId") || "";
		const scope = (searchParams.get("scope") || "") as Scope;

		if (!cyclePublicId) return bad("missing cyclePublicId");
		if (!evaluatorId) return bad("missing evaluatorId");
		if (!evaluateeId) return bad("missing evaluateeId");
		if (!scope) return bad("missing scope");

		const cycle = await prisma.evaluationCycle.findUnique({
			where: { publicId: cyclePublicId },
			select: { id: true, publicId: true },
		});
		if (!cycle) return bad("cycle not found", 404);

		// 1) KPI ของผู้รับการประเมิน (คนปัจจุบัน)
		if (scope === "EVALUATEE_SELF") {
			const e = await prisma.employee.findUnique({
				where: { id: evaluateeId },
				select: {
					id: true,
					prefixName: true,
					name: true,
					lastName: true,
					employeeNo: true,
					position: { select: { name: true } },
					level: { select: { name: true } },
					organization: { select: { name: true } },
				},
			});
			if (!e) return bad("evaluatee not found", 404);

			return Response.json({ ok: true, data: { scope, owners: [mapOwner(e)] } });
		}

		// 2) KPI ของผู้ระดับสูงกว่า (ในสายงานเดียวกัน)
		// ใช้ Org tree: organization -> parent -> parent ...
		// และเอา manager ของแต่ละ org เป็น candidate
		if (scope === "SAME_LINE_HIGHER") {
			const me = await prisma.employee.findUnique({
				where: { id: evaluateeId },
				select: { organizationId: true },
			});
			if (!me) return bad("evaluatee not found", 404);

			type OrgRow = { id: string; parentId: string | null; managerId: string | null };

			const owners: any[] = [];
			const seen = new Set<string>();

			// helper: fetch employee + push
			const pushEmp = async (empId: string) => {
				if (!empId) return;
				if (empId === evaluateeId) return;
				if (seen.has(empId)) return;

				const emp = await prisma.employee.findUnique({
					where: { id: empId },
					select: {
						id: true,
						prefixName: true,
						name: true,
						lastName: true,
						employeeNo: true,
						position: { select: { name: true } },
						level: { select: { name: true } },
						organization: { select: { name: true } },
					},
				});

				if (emp) {
					owners.push(mapOwner(emp));
					seen.add(emp.id);
				}
			};

			// helper: walk org tree and include managers
			const pushManagersUpTree = async (startOrgId: string | null) => {
				let orgId: string | null = startOrgId;

				for (let guard = 0; guard < 30 && orgId; guard++) {
					const orgRow: OrgRow | null = await prisma.organization.findUnique({
						where: { id: orgId },
						select: { id: true, parentId: true, managerId: true },
					});
					if (!orgRow) break;

					if (orgRow.managerId) {
						await pushEmp(orgRow.managerId);
					}

					orgId = orgRow.parentId ?? null;
				}
			};
		  
			// 1) include evaluator
			if (evaluatorId && evaluatorId !== evaluateeId) {
				await pushEmp(evaluatorId);
			}

			// 2) include managers up org tree of evaluatee (same line higher of evaluatee)
			await pushManagersUpTree(me.organizationId);

			// 3) include evaluator's evaluator (from assignments)
			// meaning: who evaluates "evaluatorId" in this same cycle
			if (evaluatorId && evaluatorId !== evaluateeId) {
				const evalOfEval = await prisma.evaluationAssignment.findMany({
					where: {
						cycleId: cycle.id,
						evaluateeId: evaluatorId,
					},
					select: { evaluatorId: true },
				});
			
				const ids = [...new Set(evalOfEval.map((x) => x.evaluatorId))];
			
				for (const id of ids) {
					await pushEmp(id);
				}
			}

			return Response.json({ ok: true, data: { scope, owners } });
		}

		// 3) KPI ของ evaluatee อื่น (evaluatee คนอื่นของ evaluator นี้)
		if (scope === "OTHER_EVALUATEES") {
			const assigns = await prisma.evaluationAssignment.findMany({
				where: {
					cycleId: cycle.id,
					evaluatorId,
					NOT: { evaluateeId },
				},
				select: { evaluateeId: true },
			});

			const ids = [...new Set(assigns.map((a) => a.evaluateeId))];
			if (ids.length === 0) {
				return Response.json({ ok: true, data: { scope, owners: [] } });
			}

			const emps = await prisma.employee.findMany({
				where: { id: { in: ids } },
				select: {
					id: true,
					prefixName: true,
					name: true,
					lastName: true,
					employeeNo: true,
					position: { select: { name: true } },
					level: { select: { name: true } },
					organization: { select: { name: true } },
				},
				orderBy: [{ name: "asc" }, { lastName: "asc" }],
			});

			return Response.json({ ok: true, data: { scope, owners: emps.map(mapOwner) } });
		}

		return bad("invalid scope");
	} catch (e: any) {
		console.error(e);
		return Response.json({ ok: false, message: e?.message ?? "server error" }, { status: 500 });
	}
}