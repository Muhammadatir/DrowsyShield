import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { OfflineIndicator } from "./OfflineIndicator";
import { UserMenu } from "./UserMenu";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const hideNavPaths = ["/emergency", "/auth", "/install"];
  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineIndicator />
      <InstallPrompt />
      {!hideNavPaths.includes(location.pathname) && user && (
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container flex h-14 items-center justify-end px-4">
            <UserMenu />
          </div>
        </div>
      )}
      <main className="flex-1 pb-20">
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};
