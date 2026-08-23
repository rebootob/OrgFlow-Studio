import { OrganizationSnapshot, DiffReport } from './types.js';

export function computeVersionDiff(before: OrganizationSnapshot, after: OrganizationSnapshot): DiffReport {
  const beforePosMap = new Map(before.positions.map(p => [p.id, p]));
  const afterPosMap = new Map(after.positions.map(p => [p.id, p]));

  const beforeAsgMap = new Map(before.assignments.map(a => [a.employeeId, a]));
  const afterAsgMap = new Map(after.assignments.map(a => [a.employeeId, a]));

  const empMap = new Map(after.employees.map(e => [e.id, e]));

  const movedEmployees: DiffReport['movedEmployees'] = [];
  const createdPositions: DiffReport['createdPositions'] = [];
  const closedPositions: DiffReport['closedPositions'] = [];
  const vacatedPositions: DiffReport['vacatedPositions'] = [];
  const reportingChanges: DiffReport['reportingChanges'] = [];

  // 1. Check assignments / moved employees
  for (const [empId, afterAsg] of afterAsgMap.entries()) {
    const beforeAsg = beforeAsgMap.get(empId);
    if (beforeAsg && beforeAsg.positionId !== afterAsg.positionId) {
      const fromPos = beforePosMap.get(beforeAsg.positionId);
      const toPos = afterPosMap.get(afterAsg.positionId);
      const emp = empMap.get(empId);
      movedEmployees.push({
        employeeId: empId,
        employeeName: emp ? `${emp.nameEN} (${emp.nickname || emp.nameTH})` : empId,
        fromPosition: fromPos ? `${fromPos.code} - ${fromPos.title}` : beforeAsg.positionId,
        toPosition: toPos ? `${toPos.code} - ${toPos.title}` : afterAsg.positionId
      });
    }
  }

  // 2. Check position lifecycle changes
  for (const afterPos of after.positions) {
    const beforePos = beforePosMap.get(afterPos.id);
    if (!beforePos) {
      createdPositions.push({
        positionCode: afterPos.code,
        title: afterPos.title,
        orgUnitCode: afterPos.orgUnitCode
      });
    } else {
      if (beforePos.lifecycle !== 'VACANT' && afterPos.lifecycle === 'VACANT') {
        vacatedPositions.push({
          positionCode: afterPos.code,
          title: afterPos.title,
          orgUnitCode: afterPos.orgUnitCode
        });
      }
      if (beforePos.lifecycle !== 'CLOSED' && afterPos.lifecycle === 'CLOSED') {
        closedPositions.push({
          positionCode: afterPos.code,
          title: afterPos.title,
          orgUnitCode: afterPos.orgUnitCode
        });
      }
      if (beforePos.reportsToPositionId !== afterPos.reportsToPositionId) {
        reportingChanges.push({
          positionCode: afterPos.code,
          fromReportsTo: beforePos.reportsToPositionId,
          toReportsTo: afterPos.reportsToPositionId
        });
      }
    }
  }

  return {
    movedEmployees,
    createdPositions,
    closedPositions,
    vacatedPositions,
    reportingChanges,
    headcountDelta: {
      before: before.employees.length,
      after: after.employees.length,
      netChange: after.employees.length - before.employees.length
    }
  };
}
