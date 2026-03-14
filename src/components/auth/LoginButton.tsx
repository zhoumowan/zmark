import { Github, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { Button } from "../ui/button";

export const LoginButton = () => {
  const { login, loading, error } = useAuthStore();

  const handleLogin = async () => {
    await login();
    if (error) {
      toast.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleLogin}
        disabled={loading}
        variant="secondary"
        className="w-full"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github />}
        {loading ? "正在登录..." : "使用 GitHub 登录"}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
