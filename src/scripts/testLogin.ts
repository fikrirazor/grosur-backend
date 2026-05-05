import { loginUser } from "../services/auth.service";

async function main() {
  try {
    const res = await loginUser({
      email: "nama@email.com",
      password: "Password123!",
    });
    console.log("LOGIN SUCCESS", res);
  } catch (error: any) {
    console.error("LOGIN FAILED", error.message);
  }
}

main();
