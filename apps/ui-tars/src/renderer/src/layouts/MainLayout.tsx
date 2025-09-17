import { Outlet } from 'react-router';
import { AppSidebar } from '@/renderer/src/components/SideBar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar';
import { FirstRunWizard } from '@/renderer/src/components/OrPaynter';
import { useOrPaynterStore } from '@/renderer/src/store/orpaynter';
import { useOrPaynterIntegration } from '@/renderer/src/hooks/useOrPaynterIntegration';

export function MainLayout() {
  const { completeFirstRun, skipFirstRun } = useOrPaynterStore();
  const { showFirstRunWizard } = useOrPaynterIntegration();

  return (
    <SidebarProvider
      style={{ '--sidebar-width-icon': '72px' }}
      className="flex h-screen w-full bg-white"
    >
      <AppSidebar />
      <SidebarInset className="flex-1">
        <Outlet />
      </SidebarInset>
      
      {/* OrPaynter First-Run Wizard */}
      {showFirstRunWizard && (
        <FirstRunWizard
          onComplete={completeFirstRun}
          onSkip={skipFirstRun}
        />
      )}
    </SidebarProvider>
  );
}
