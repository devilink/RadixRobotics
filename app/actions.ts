"use server"

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { cookies } from 'next/headers';
import path from 'path';

// To prevent Prisma Client instantiation issues in dev mode
const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const dbPath = path.resolve(process.cwd(), 'dev.db');
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function loginCurriculum(username: string, pass: string) {
  const user = await prisma.curriculumUser.findUnique({
    where: { username }
  });
  
  if (!user || user.password !== pass) {
    return { success: false, error: 'Invalid username or password' };
  }
  
  const cookieStore = await cookies();
  cookieStore.set('curriculum_auth', 'true', { maxAge: 60 * 60 * 24 * 7, httpOnly: true });
  return { success: true };
}

export async function logoutCurriculum() {
  const cookieStore = await cookies();
  cookieStore.delete('curriculum_auth');
}

export async function getCurriculumUsers() {
  return await prisma.curriculumUser.findMany({
    select: { id: true, username: true, createdAt: true, password: true } // Return password just for admin visibility in this simple demo
  });
}

export async function createCurriculumUser(data: FormData) {
  const username = data.get('username') as string;
  const password = data.get('password') as string;
  
  try {
    await prisma.curriculumUser.create({
      data: { username, password }
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCurriculumUser(id: string) {
  try {
    await prisma.curriculumUser.delete({
      where: { id }
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateCurriculumUser(id: string, data: FormData) {
  const username = data.get('username') as string;
  const password = data.get('password') as string;
  try {
    await prisma.curriculumUser.update({
      where: { id },
      data: { username, password }
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
