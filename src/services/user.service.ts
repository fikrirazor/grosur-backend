import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";

const USER_PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  addresses: true,
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_PROFILE_SELECT,
  });

  if (!user) throw new AppError(404, "User not found");
  return user;
};
