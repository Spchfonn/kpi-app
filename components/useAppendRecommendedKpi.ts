import { KpiTreeNode } from "./TwoLevelKpiTable";

export function appendRecommendedKpi(
  current: KpiTreeNode[],
  recommended: KpiTreeNode[]
): KpiTreeNode[] {
  let groupNo = current.length;

  return [
    ...current,
    ...recommended.map((g, gi) => ({
      ...g,
      displayNo: String(groupNo + gi + 1),
      children: g.children.map((c, ci) => ({
        ...c,
        displayNo: `${groupNo + gi + 1}.${ci + 1}`,
      })),
    })),
  ];
}
