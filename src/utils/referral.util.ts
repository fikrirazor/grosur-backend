import crypto from "crypto";
import prisma from "../config/database";

export const generateFriendlyReferralCode = async (
  nameOrEmail: string,
): Promise<string> => {
  // Extract first word, strip non-alphanumeric, uppercase it
  let base = nameOrEmail
    .split(" ")[0]
    .split("@")[0]
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (base.length < 3) base = "GLORY"; // Fallback prefix if string is too short/empty

  // Ensure uniqueness
  let isUnique = false;
  let code = "";

  while (!isUnique) {
    // Generate 3 random hex characters (usually 4 chars, slice first 3)
    const randomStr = crypto
      .randomBytes(2)
      .toString("hex")
      .toUpperCase()
      .substring(0, 3);
    code = `${base}${randomStr}`;

    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    });
    if (!existing) {
      isUnique = true;
    }
  }

  return code;
};
