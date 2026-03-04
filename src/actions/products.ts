"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireDecider } from "@/lib/permissions";

async function getSession() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getProducts() {
  const session = await getSession();
  return db.product.findMany({
    where: { tenantId: session.user.tenantId, deletedAt: null },
    include: { images: true, specs: true, categories: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProduct(id: string) {
  const session = await getSession();
  return db.product.findFirst({
    where: { id, tenantId: session.user.tenantId, deletedAt: null },
    include: { images: true, specs: true, categories: true },
  });
}

export async function createProduct(data: {
  name: string;
  sku?: string;
  description?: string;
  detailedContent?: string;
  status?: string;
}) {
  const session = await getSession();
  const slug =
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `product-${Date.now()}`;

  const product = await db.product.create({
    data: {
      tenantId: session.user.tenantId,
      name: data.name,
      slug,
      sku: data.sku,
      description: data.description,
      detailedContent: data.detailedContent,
      status: data.status || "draft",
    },
  });

  revalidatePath("/zh-CN/products");
  return product;
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    sku?: string;
    description?: string;
    detailedContent?: string;
    status?: string;
  }
) {
  const session = await getSession();
  const product = await db.product.update({
    where: { id },
    data: {
      ...data,
      tenantId: session.user.tenantId,
    },
  });

  revalidatePath("/zh-CN/products");
  revalidatePath(`/zh-CN/products/${id}`);
  return product;
}

export async function deleteProduct(id: string) {
  const session = await getSession();
  const roleCheck = requireDecider(session);
  if (!roleCheck.authorized) {
    throw new Error(roleCheck.error);
  }
  await db.product.update({
    where: { id },
    data: { deletedAt: new Date(), tenantId: session.user.tenantId },
  });
  revalidatePath("/zh-CN/products");
}
