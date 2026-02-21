import { AppSidebar } from "./components/app-sidebar";
import Editor from "./components/editor";
import { SidebarProvider } from "./components/ui/sidebar";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";

const App = () => {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar />
        <div className="content flex-1">
          <Editor />
        </div>
        <Toaster />
      </TooltipProvider>
    </SidebarProvider>
  );
};

export default App;
