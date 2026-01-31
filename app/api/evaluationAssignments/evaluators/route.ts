import { prisma } from "@/prisma/client";
import { AuthError, requireUser } from "@/app/lib/auth";

export async function GET(req: Request) {
	try {
		await requireUser();
		const { searchParams } = new URL(req.url);

		const cyclePublicId = searchParams.get("cyclePublicId");
		const evaluateeId = searchParams.get("evaluateeId");

		if (!cyclePublicId || !evaluateeId) {
			return Response.json({ ok: false, message: "missing params" }, { status: 400 });
		}

		const rows = await prisma.evaluationAssignment.findMany({
			where: {
				cycle: { publicId: cyclePublicId },
				evaluateeId: evaluateeId,
			},
			select: {
				id: true,
				currentPlanId: true,
				weightPercent: true,
				evaluator: {
					select: {
						id: true,
						fullNameTh: true,
						title: true,
						organization: { select: { name: true } },
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		const items = rows.map((r) => ({
			assignmentId: r.id,
			currentPlanId: r.currentPlanId,
			weightPercent: String(r.weightPercent),
			evaluator: {
				id: r.evaluator.id,
				fullName: r.evaluator.fullNameTh,
				title: r.evaluator.title ?? "-",
				organization: r.evaluator.organization?.name ?? "-",
			},
		}));

		return Response.json({ ok: true, data: { items } });
	} catch (e: any) {
		if (e instanceof AuthError) return Response.json({ message: e.message }, { status: e.status });
		return Response.json({ message: "Server error" }, { status: 500 });
	}
}