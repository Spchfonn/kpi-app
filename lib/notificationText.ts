import { NotificationType } from "@prisma/client";

export type UiNotiType = "pending" | "success" | "error" | "info";

export const NOTIFICATION_UI: Record<
  NotificationType,
  {
    uiType: UiNotiType;
    title: (actor?: string, cycleName?: string) => string;
  }
> = {
  EVALUATEE_REQUEST_EVALUATOR_APPROVE_KPI: {
    uiType: "pending",
    title: (actor, cycle) =>
      `${actor ?? "ผู้รับการประเมิน"} ต้องการให้คุณอนุมัติตัวชี้วัด ${cycle ?? ""}`,
  },

  EVALUATEE_CONFIRM_EVALUATOR_KPI: {
    uiType: "success",
    title: (actor, cycle) =>
      `${actor ?? "ผู้รับการประเมิน"} รับรองตัวชี้วัด ${cycle ?? ""} เรียบร้อยแล้ว`,
  },

  EVALUATEE_REJECT_EVALUATOR_KPI: {
    uiType: "error",
    title: (actor, cycle) =>
      `${actor ?? "ผู้รับการประเมิน"} ปฏิเสธตัวชี้วัด ${cycle ?? ""}`,
  },

  EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI: {
    uiType: "pending",
    title: (actor, cycle) =>
      `${actor ?? "ผู้ประเมิน"} ขอให้คุณรับรองตัวชี้วัด ${cycle ?? ""}`,
  },

  EVALUATOR_REQUEST_EVALUATEE_DEFINE_KPI: {
    uiType: "info",
    title: (actor, cycle) =>
      `${actor ?? "ผู้ประเมิน"} มอบหมายให้คุณกำหนดตัวชี้วัด ${cycle ?? ""}`,
  },

  EVALUATOR_APPROVE_EVALUATEE_KPI: {
    uiType: "success",
    title: (actor, cycle) =>
      `${actor ?? "ผู้ประเมิน"} อนุมัติตัวชี้วัดของคุณ ${cycle ?? ""} แล้ว`,
  },

  EVALUATOR_REJECT_EVALUATEE_KPI: {
    uiType: "error",
    title: (actor, cycle) =>
      `${actor ?? "ผู้ประเมิน"} ปฏิเสธตัวชี้วัดของคุณ ${cycle ?? ""}`,
  },
};
