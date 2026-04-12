"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, WifiOff } from "lucide-react";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function GlobalRouteLoading() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[110] h-0.5 w-full overflow-hidden">
      <div key={pathname} className="route-loading-bar h-full w-full bg-primary" />
    </div>
  );
}

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStatus = () => setIsOffline(!window.navigator.onLine);
    syncStatus();

    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);

    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-2 border-b border-warning bg-card px-4 py-2 text-sm text-warning"
    >
      <WifiOff className="h-4 w-4" />
      You are offline. Uploads are queued and can be retried once connectivity returns.
    </div>
  );
}

function SessionExpiredDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onSessionExpired = () => {
      sessionStorage.setItem("fairswarm:returnTo", window.location.pathname + window.location.search);
      setOpen(true);
    };

    window.addEventListener("fairswarm:session-expired", onSessionExpired as EventListener);
    return () => {
      window.removeEventListener("fairswarm:session-expired", onSessionExpired as EventListener);
    };
  }, []);

  const relogin = () => {
    const returnTo = sessionStorage.getItem("fairswarm:returnTo") ?? "/dashboard";
    router.push(`/login?reason=session-expired&returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[130] bg-black/60" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[131] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-5"
          aria-describedby="session-expired-description"
        >
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <Dialog.Title className="text-lg font-semibold text-white">Session expired</Dialog.Title>
          </div>
          <Dialog.Description id="session-expired-description" className="text-sm text-slate-300">
            Your login session has expired. Re-login to continue without losing your current page context.
          </Dialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} aria-label="Dismiss session expiry modal">
              Stay here
            </Button>
            <Button onClick={relogin} aria-label="Re-login to continue">
              Re-login
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <OfflineBanner />
          <SessionExpiredDialog />
          <GlobalRouteLoading />
          {children}
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
