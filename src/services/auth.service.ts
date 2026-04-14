import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { hashPassword, comparePassword } from "../utils/password.util";
import { generateToken } from "../utils/jwt.util";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  managedStore: true,
  createdAt: true,
  updatedAt: true,
};

export const registerUser = async (data: any) => {
  const { name, email, password } = data;
  if (await checkUserExists(email)) {
    throw new AppError(409, "User with this email already exists");
  }
  const newUser = await createUserAccount(name, email, password);
  return formatAuthResponse(newUser);
};

export const loginUser = async (data: any) => {
  const user = await validateCredentials(data.email, data.password);
  return formatAuthResponse(user);
};

const checkUserExists = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { managedStore: true },
  });
};

const createUserAccount = async (name: string, email: string, pass: string) => {
  const hashedPassword = await hashPassword(pass);
  return await prisma.user.create({
    data: { name, email, password: hashedPassword, role: "USER" },
    select: USER_SELECT,
  });
};

const validateCredentials = async (email: string, pass: string) => {
  const user = await checkUserExists(email);
  if (
    !user ||
    !user.password ||
    !(await comparePassword(pass, user.password))
  ) {
    throw new AppError(401, "Invalid email or password");
  }
  return user;
};

const formatAuthResponse = (user: any) => {
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const { password: _, ...userWithoutPassword } = user; // Ensure password is excluded
  return { user: userWithoutPassword, token };
};
