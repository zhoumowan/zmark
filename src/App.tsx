import { AppSidebar } from "./components/app-sidebar"
import { SidebarProvider } from "./components/ui/sidebar"

const App = () => {
  return (
    <SidebarProvider>
      <AppSidebar/>
      <div className="content">
        <h1>Welcome to Tauri + React</h1>
      </div>
    </SidebarProvider>
  )
}

export default App