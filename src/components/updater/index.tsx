import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, Check, Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { version as appVersion } from "@/../package.json";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAsyncAction } from "@/hooks";

interface UpdateCheckResult {
  available: boolean;
  current_version: string;
  latest_version: string | null;
  release_notes: string | null;
}

export const UpdaterCard = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const checkForUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const result = await invoke<UpdateCheckResult>("check_for_update");
      setUpdateInfo(result);
      if (result.available) {
        toast.success(`发现新版本: ${result.latest_version}`);
      } else {
        toast.success("已是最新版本");
      }
    } catch (e) {
      console.error("检查更新失败:", e);
      toast.error("检查更新失败");
    } finally {
      setChecking(false);
    }
  }, []);

  const { execute: installUpdate, isLoading: isInstalling } = useAsyncAction(
    async () => {
      await invoke("install_update");
      return null;
    },
    {
      loadingMessage: "正在下载并安装更新...",
      successMessage: "更新安装成功，请重启应用",
      errorMessage: (e) => `安装更新失败: ${e}`,
    },
  );

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>版本更新</CardTitle>
        <CardDescription>当前版本: {appVersion}</CardDescription>
      </CardHeader>
      <CardContent>
        {updateInfo?.available ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertCircle className="size-5" />
              <span className="font-medium">发现新版本</span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">最新版本: </span>
                <span className="font-medium">{updateInfo.latest_version}</span>
              </div>
              {updateInfo.release_notes && (
                <div>
                  <div className="text-muted-foreground mb-1">更新内容:</div>
                  <div className="bg-muted p-3 rounded-md text-xs max-h-40 overflow-y-auto">
                    {updateInfo.release_notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : updateInfo ? (
          <div className="flex items-center gap-2 text-emerald-500">
            <Check className="size-5" />
            <span>已是最新版本</span>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">正在检查更新...</div>
        )}
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <Button
          variant="secondary"
          onClick={checkForUpdate}
          disabled={checking || isInstalling}
        >
          {checking ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              检查中
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              检查更新
            </>
          )}
        </Button>
        {updateInfo?.available && (
          <Button onClick={() => installUpdate()} disabled={isInstalling}>
            {isInstalling ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                安装中
              </>
            ) : (
              <>
                <Download className="size-4" />
                立即更新
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
