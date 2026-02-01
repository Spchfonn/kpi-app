import { redirect, notFound } from "next/navigation";
import { prisma } from "@/prisma/client";

type Props = {
  params: Promise<{ cycleId: string }>;
};

export default async function EvaluateeLanding({ params }: Props) {
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
      redirect(`/${cycleId}/evaluatee/defineKpi`);

    case "EVALUATE":
      redirect(`/${cycleId}/evaluatee/evaluateKpi`);

    case "SUMMARY":
      redirect(`/${cycleId}/evaluatee/summaryKpi`);

    default:
      notFound();
  }
}