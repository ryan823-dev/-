import { redirect } from "next/navigation";
import { headers } from "next/headers";
import LandingPage from "@/components/LandingPage";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "vertax.top";

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  // Check if it's the root domain
  const isRootDomain = host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}`;
  
  // Check if it's a customer subdomain
  const isCustomerSubdomain = host.endsWith(`.${BASE_DOMAIN}`) && 
    !host.startsWith("tower.") && 
    !host.startsWith("www.");
  
  // Check if it's tower (operations) subdomain
  const isTowerSubdomain = host === `tower.${BASE_DOMAIN}`;
  
  // If customer subdomain, redirect to login
  if (isCustomerSubdomain) {
    redirect("/login");
  }
  
  // If tower subdomain, redirect to login
  if (isTowerSubdomain) {
    redirect("/login");
  }
  
  // Only show landing page for root domain
  if (isRootDomain) {
    return <LandingPage />;
  }
  
  // Default: show landing page
  return <LandingPage />;
}
