import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAsyncAction } from "@/hooks";
import { useAuthStore } from "@/stores";

export const AccountSettingsPage = () => {
  const { user, loading, updateAccount } = useAuthStore();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    const latest = useAuthStore.getState().user;
    if (!latest || latest.id !== userId) return;
    setName(latest.name || "");
    setAvatarUrl(latest.avatar_url || "");
  }, [userId]);

  const { execute: save, isLoading: isSaving } = useAsyncAction(
    async () => {
      const err = await updateAccount({
        name,
        avatar_url: avatarUrl,
      });
      if (err) {
        throw new Error(err);
      }
      return null;
    },
    {
      loadingMessage: "保存中...",
      successMessage: "设置已保存",
      errorMessage: (e) => e.message,
    },
  );

  if (!user) return null;

  return (
    <div className="flex h-full w-full overflow-auto p-6">
      <div className="w-full max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>设置</CardTitle>
            <CardDescription>仅支持修改展示名称与头像。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarImage src={avatarUrl || user.avatar_url || ""} />
                <AvatarFallback>
                  {(name || user.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="text-sm font-medium">{name || "用户"}</div>
                <div className="text-xs text-muted-foreground">
                  {user.email || ""}
                </div>
              </div>
            </div>

            <div className="grid gap-1">
              <div className="text-xs text-muted-foreground">展示名称</div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading || isSaving}
              />
            </div>

            <div className="grid gap-1">
              <div className="text-xs text-muted-foreground">头像 URL</div>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                disabled={loading || isSaving}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => save()}
              disabled={loading || isSaving}
            >
              {loading || isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  保存中
                </>
              ) : (
                "保存"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
