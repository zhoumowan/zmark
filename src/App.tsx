import { AppSidebar } from "./components/app-sidebar"
import Editor from "./components/editor"
import { SidebarProvider } from "./components/ui/sidebar"

const App = () => {
  return (
    <SidebarProvider>
      <AppSidebar/>
      <div className="content">
        <Editor />
      </div>
    </SidebarProvider>
  )
}

export default App