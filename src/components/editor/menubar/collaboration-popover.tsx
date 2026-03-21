import { Check, Copy, LogOut, Play, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCollaborationStore } from "@/stores";
import { MenuButton } from "./menu-button";

// biome-ignore lint/suspicious/noExplicitAny: <WebrtcProvider type is complex and not fully exported>
export const CollaborationPopover = ({ provider }: { provider: any }) => {
  const {
    roomName,
    userName,
    userColor,
    setRoomName,
    setUserName,
    setUserColor,
  } = useCollaborationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  // biome-ignore lint/suspicious/noExplicitAny: <User state type from y-protocols is complex>
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!provider) {
      setActiveUsers([]);
      return;
    }
    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values());
      // states contain { user: { name, color } }
      const users = states
        // biome-ignore lint/suspicious/noExplicitAny: <Awareness state is dynamic>
        .filter((state: any) => state.user)
        // biome-ignore lint/suspicious/noExplicitAny: <Awareness state is dynamic>
        .map((state: any) => state.user);
      // Remove duplicates by name
      const uniqueUsers = Array.from(
        // biome-ignore lint/suspicious/noExplicitAny: <User state is dynamic>
        new Map(users.map((u: any) => [u.name, u])).values(),
      );
      setActiveUsers(uniqueUsers);
    };
    provider.awareness.on("change", updateUsers);
    updateUsers();
    return () => {
      provider.awareness.off("change", updateUsers);
    };
  }, [provider]);

  const handleCreateRoom = () => {
    const newRoom = `room-${Math.random().toString(36).substring(2, 9)}`;
    setRoomName(newRoom);
    toast.success("房间创建成功，快去邀请好友吧！");
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast.error("请输入房间号");
      return;
    }
    setRoomName(joinRoomId.trim());
    toast.success("已加入房间");
  };

  const handleLeaveRoom = () => {
    setRoomName(null);
    setJoinRoomId("");
    toast.info("已退出协同模式");
  };

  const copyRoomId = () => {
    if (roomName) {
      navigator.clipboard.writeText(roomName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("房间号已复制");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <MenuButton icon={Users} label="协同编辑" isActive={!!roomName} />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="center" side="bottom">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm">个人信息</h3>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={userColor}
                onChange={(e) => setUserColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="你的昵称"
                className="flex-1 h-8 text-sm"
              />
            </div>
          </div>

          <div className="h-px bg-border my-1" />

          {!roomName ? (
            <div className="flex flex-col gap-3">
              <Button onClick={handleCreateRoom} className="w-full" size="sm">
                <Play className="w-4 h-4 mr-2" />
                创建协同房间
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="输入房间号"
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                />
                <Button onClick={handleJoinRoom} size="sm" variant="secondary">
                  <UserPlus className="w-4 h-4 mr-1" />
                  加入
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  当前房间号
                </span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-2 py-1 rounded text-sm select-all">
                    {roomName}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={copyRoomId}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">
                  在线用户 ({activeUsers.length})
                </span>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {activeUsers.map((u, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: <Array is static enough for simple UI display>
                      key={i}
                      className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full text-xs"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: u.color }}
                      />
                      <span className="truncate max-w-[100px]">{u.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleLeaveRoom}
                variant="destructive"
                size="sm"
                className="w-full mt-2"
              >
                <LogOut className="w-4 h-4 mr-2" />
                退出房间
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
