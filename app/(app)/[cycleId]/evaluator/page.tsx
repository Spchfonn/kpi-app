import { redirect, notFound } from "next/navigation";
import { prisma } from "@/prisma/client";

type Props = {
  params: { cycleId: string };
};

export default async function EvaluatorLanding({ params }: Props) {
  const cycleId = Number(params.cycleId);

  if (!Number.isFinite(cycleId)) {
    notFound();
  }

  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    select: { status: true },
  });

  if (!cycle) {
    notFound();
  }

  switch (cycle.status) {
    case "DEFINE":
      redirect(`/${cycleId}/evaluator/defineKpi`);

    case "EVALUATE":
      redirect(`/${cycleId}/evaluator/evaluateKpi`);

    case "SUMMARY":
      redirect(`/${cycleId}/evaluator/summaryKpi`);

    default:
      notFound();
  }
}