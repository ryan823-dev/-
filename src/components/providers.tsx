"use client";

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { RoleProvider } from "@/contexts/role-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RoleProvider>
        <TooltipProvider>
          {children}
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </RoleProvider>
    </SessionProvider>
  );
}
