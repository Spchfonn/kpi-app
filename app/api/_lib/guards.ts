import { forbid } from "./kpiWorkflow";
import { KpiDefineMode } from "./type";

export function isEvaluator(user: any, a: any) {
    return !!user.employeeId && user.employeeId === a.evaluatorId;
}
export function isEvaluatee(user: any, a: any) {
    return !!user.employeeId && user.employeeId === a.evaluateeId;
}

export function isDefineOwner(user: any, cycle: any, assignment: any) {
    const m = cycle.kpiDefineMode as KpiDefineMode;
    return m === "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS"
        ? isEvaluator(user, assignment)
        : isEvaluatee(user, assignment);
}

export function isConfirmer(user: any, cycle: any, assignment: any) {
    const m = cycle.kpiDefineMode as KpiDefineMode;
    return m === "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS"
        ? isEvaluatee(user, assignment)
        : isEvaluator(user, assignment);
}

/**
 * Visibility policy:
 * - admin: all
 * - defineOwner: all statuses
 * - confirmer: only REQUESTED/CONFIRMED/REJECTED
 */
export function canViewPlan(user: any, cycle: any, assignment: any, plan: any) {
    if (user.isAdmin) return true;

    if (isEvaluator(user, assignment)) return true;

    if (isDefineOwner(user, cycle, assignment)) return true;

    if (isConfirmer(user, cycle, assignment)) {
        return ["REQUESTED", "CONFIRMED", "REJECTED"].includes(plan.confirmStatus);
    }

    return false;
}

export function assertCanViewPlan(user: any, cycle: any, assignment: any, plan: any) {
    if (!canViewPlan(user, cycle, assignment, plan)) {
        forbid("ไม่สามารถดูตัวชี้วัดได้ในขณะนี้");
    }
}