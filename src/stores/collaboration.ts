import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ICollaborationStore {
  roomName: string | null;
  userName: string;
  userColor: string;
  setRoomName: (roomName: string | null) => void;
  setUserName: (userName: string) => void;
  setUserColor: (userColor: string) => void;
}

const generateRandomColor = () => {
  const colors = [
    "#f783ac",
    "#8ce99a",
    "#74c0fc",
    "#4dabf7",
    "#3bc9db",
    "#38d9a9",
    "#69db7c",
    "#a9e34b",
    "#ffd43b",
    "#ffa94d",
    "#ff922b",
    "#ff6b6b",
    "#f06595",
    "#cc5de8",
    "#b197fc",
    "#845ef7",
    "#5c7cfa",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useCollaborationStore = create<ICollaborationStore>()(
  persist(
    (set) => ({
      roomName: null,
      userName: `User_${Math.floor(Math.random() * 10000)}`,
      userColor: generateRandomColor(),
      setRoomName: (roomName) => set({ roomName }),
      setUserName: (userName) => set({ userName }),
      setUserColor: (userColor) => set({ userColor }),
    }),
    {
      name: "collaboration-storage",
      partialize: (state) => ({
        userName: state.userName,
        userColor: state.userColor,
      }), // 仅持久化用户信息，不持久化房间号
    },
  ),
);
