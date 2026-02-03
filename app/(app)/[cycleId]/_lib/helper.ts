async function getPlanForAssignment(assignmentId: string) {
    const ap = await fetch(`/api/evaluationAssignments/${assignmentId}/plans`, { cache: "no-store" });
    const j = await ap.json();
    if (!j.ok) throw new Error(j.message ?? "load assignment plan failed");
    return j.data; // null or plan object
}