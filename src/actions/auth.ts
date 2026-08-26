"use server";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session || typeof session.userId !== "string") return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        status: true,
        monthlyBaseSalary: true,
        shiftTiming: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      monthlyBaseSalary: user.monthlyBaseSalary
        ? Number(user.monthlyBaseSalary)
        : null,
    };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      (("digest" in error && error.digest === "DYNAMIC_SERVER_USAGE") ||
        ("message" in error &&
          typeof error.message === "string" &&
          error.message.includes("DYNAMIC_SERVER_USAGE")))
    ) {
      throw error;
    }
    console.error("Get current user error:", error);
    return null;
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { success: false, error: "Invalid credentials" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { success: false, error: "Invalid credentials" };
    }

    await createSession(user.id);
    return { success: true };
  } catch {
    return { success: false, error: "An error occurred during login" };
  }
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const repeatPassword = formData.get("repeatPassword") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  if (password !== repeatPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    await createSession(user.id);
    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function logout() {
  await destroySession();
}

export async function updatePassword(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and new password are required" };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { success: false, error: "Failed to update password" };
  }
}
