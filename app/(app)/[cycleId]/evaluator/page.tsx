import { redirect, notFound } from "next/navigation";
import { prisma } from "@/prisma/client";

type Props = {
  params: Promise<{ cycleId: string }>;
};

export default async function EvaluatorLanding({ params }: Props) {
  const { cycleId } = await params;

  const cycle = await prisma.evaluationCycle.findUnique({
    where: { publicId: cycleId },
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