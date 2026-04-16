import prisma from "../config/database";

export const createAuditLog = async (
  action: string,
  actorId: string,
  targetId?: string,
  targetType?: string,
  details?: any,
) => {
  try {
    await prisma.actionLog.create({
      data: {
        action,
        actorId,
        targetId,
        targetType,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};
