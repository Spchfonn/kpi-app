import { prisma } from "@/prisma/client";
import { CycleGates, Gate } from "./type";

export function computeOpen(enabled: boolean, startAt?: Date | null, endAt?: Date | null) {
	if (!enabled) return false;
	const now = new Date();
	if (startAt && now < startAt) return false;
	if (endAt && now > endAt) return false;
	return true;
}

export async function getCycleGates(cycleId: number): Promise<CycleGates> {
	const rows = await prisma.cycleActivity.findMany({
		where: { cycleId },
		select: { type: true, enabled: true, startAt: true, endAt: true },
	});

	const gates: CycleGates = { DEFINE: false, EVALUATE: false, SUMMARY: false };
	for (const r of rows) {
		const open = computeOpen(r.enabled, r.startAt, r.endAt);
		if (r.type === "DEFINE") gates.DEFINE = open;
		if (r.type === "EVALUATE") gates.EVALUATE = open;
		if (r.type === "SUMMARY") gates.SUMMARY = open;
	}
	return gates;
}

export function requireGate(gates: CycleGates, gate: Gate) {
	if (!gates[gate]) {
		const err = new Error(`Gate ${gate} is closed`);
		(err as any).status = 403;
		throw err;
	}
}

export function forbid(message: string, status = 403) {
	const err = new Error(message);
	(err as any).status = status;
	throw err;
}