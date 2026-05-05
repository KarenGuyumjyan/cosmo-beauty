'use server';

import { prisma } from '@/lib/prisma';

export async function submitContactForm(name: string, phone: string, message?: string) {
  await prisma.contactApplication.create({
    data: { name, phone, message },
  });

  return { success: true };
}
