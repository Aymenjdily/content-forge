"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface TemplateConfig {
  tone: string;
  length: string;
  platforms: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  config: TemplateConfig;
  createdAt: Date;
}

const validTones = ["professional", "casual", "witty", "educational"];
const validLengths = ["short", "medium", "long"];
const validPlatforms = ["blog", "linkedin", "twitter"];

async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const image = clerkUser.imageUrl || null;

  return prisma.user.upsert({
    where: { email },
    create: { email, name, image },
    update: { name, image },
  });
}

function normalizeConfig(config: unknown): TemplateConfig {
  const raw = (config ?? {}) as Partial<TemplateConfig>;

  const tone = validTones.includes(raw.tone || "") ? raw.tone! : "professional";
  const length = validLengths.includes(raw.length || "") ? raw.length! : "medium";
  const platforms = Array.isArray(raw.platforms)
    ? raw.platforms.filter((p) => validPlatforms.includes(p))
    : ["blog"];

  return {
    tone,
    length,
    platforms: platforms.length > 0 ? platforms : ["blog"],
  };
}

export async function getTemplates(): Promise<Template[]> {
  const user = await getDbUser();
  if (!user) return [];

  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return templates.map((t) => ({
    ...t,
    config: normalizeConfig(t.config),
  }));
}

export interface CreateTemplateState {
  error?: string;
  success?: boolean;
  template?: Template;
}

export async function createTemplate(_prevState: CreateTemplateState, formData: FormData): Promise<CreateTemplateState> {
  const user = await getDbUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const tone = formData.get("tone")?.toString() || "professional";
  const length = formData.get("length")?.toString() || "medium";
  const platformsRaw = formData.getAll("platforms");

  if (!name || name.length < 2) {
    return { error: "Template name is required and must be at least 2 characters." };
  }

  const config = normalizeConfig({ tone, length, platforms: platformsRaw.map((p) => p.toString()) });

  const template = await prisma.template.create({
    data: {
      userId: user.id,
      name,
      description,
      config: config as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    success: true,
    template: {
      ...template,
      config: normalizeConfig(template.config),
    },
  };
}

export async function deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getDbUser();
  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template || template.userId !== user.id) {
    return { success: false, error: "Template not found." };
  }

  await prisma.template.delete({
    where: { id },
  });

  return { success: true };
}
