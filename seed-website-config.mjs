import pkg from "./src/generated/prisma/client.js";
const { PrismaClient } = pkg;

const db = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function seed() {
  const tenant = await db.tenant.findFirst();
  if (!tenant) {
    console.error("No tenant found");
    process.exit(1);
  }
  console.log(`Found tenant: ${tenant.id} (${tenant.name})`);

  const config = await db.websiteConfig.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      url: "https://www.tdpaintcell.com",
      siteType: "supabase",
      supabaseUrl: "https://ltsfyfqsdesnkleryfxn.supabase.co",
      functionName: "receive-content-push",
      pushSecret: "5nMtn0vQEX5rv6WNB7r11aXoaxTFd/6gGDFJkEoWC0U=",
      approvalTimeoutHours: 24,
      isActive: true,
    },
    update: {
      url: "https://www.tdpaintcell.com",
      siteType: "supabase",
      supabaseUrl: "https://ltsfyfqsdesnkleryfxn.supabase.co",
      functionName: "receive-content-push",
      pushSecret: "5nMtn0vQEX5rv6WNB7r11aXoaxTFd/6gGDFJkEoWC0U=",
      approvalTimeoutHours: 24,
      isActive: true,
    },
  });

  console.log(`WebsiteConfig saved: ${config.id}`);
  await db.$disconnect();
}

seed().catch(console.error);
