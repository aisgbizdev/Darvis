import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  PanelLeftClose,
  Loader2,
} from "lucide-react";

interface ChatRoom {
  id: number;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface RoomsResponse {
  rooms: ChatRoom[];
}

interface ConversationSidebarProps {
  activeRoomId: number | null;
  onSelectRoom: (roomId: number | null) => void;
  onClose: () => void;
}

export function ConversationSidebar({ activeRoomId, onSelectRoom, onClose }: ConversationSidebarProps) {
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const { data, isLoading } = useQuery<RoomsResponse>({
    queryKey: ["/api/rooms"],
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/rooms", { title: "Obrolan Baru" });
      return res.json();
    },
    onSuccess: (data: { room: ChatRoom }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      if (data.room) {
        onSelectRoom(data.room.id);
      }
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      await apiRequest("PATCH", `/api/rooms/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setEditId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rooms/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      if (activeRoomId === deletedId) {
        onSelectRoom(null);
      }
    },
  });

  useEffect(() => {
    if (editId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editId]);

  const rooms = data?.rooms || [];

  const handleRoomClick = useCallback((roomId: number, isEditing: boolean) => {
    if (!isEditing) onSelectRoom(roomId);
  }, [onSelectRoom]);

  return (
    <div className="flex flex-col h-full bg-card/50" data-testid="panel-conversation-sidebar">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" data-testid="text-rooms-title">Obrolan</h3>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            data-testid="button-new-room"
            title="Obrolan baru"
          >
            {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="sm:hidden"
            data-testid="button-close-sidebar"
            title="Tutup"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && rooms.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-[11px] text-muted-foreground" data-testid="text-no-rooms">Belum ada room</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs gap-1.5"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              data-testid="button-create-first-room"
            >
              <Plus className="w-3 h-3" />
              Mulai Obrolan
            </Button>
          </div>
        )}

        {rooms.map((room) => {
          const isActive = activeRoomId === room.id;
          const isEditing = editId === room.id;

          return (
            <div
              key={room.id}
              className={`group flex items-center gap-1.5 px-2 mx-1.5 rounded-md cursor-pointer ${isActive ? "bg-muted" : "hover-elevate"}`}
              onClick={() => handleRoomClick(room.id, isEditing)}
              data-testid={`room-item-${room.id}`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />

              {isEditing ? (
                <div className="flex-1 flex items-center gap-1 py-1" onClick={(e) => e.stopPropagation()}>
                  <Input
                    ref={editRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter" && editTitle.trim()) {
                        renameMutation.mutate({ id: room.id, title: editTitle.trim() });
                      }
                      if (e.key === "Escape") setEditId(null);
                    }}
                    className="text-xs flex-1"
                    data-testid={`input-rename-room-${room.id}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editTitle.trim()) renameMutation.mutate({ id: room.id, title: editTitle.trim() });
                    }}
                    data-testid={`button-confirm-rename-${room.id}`}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); setEditId(null); }}
                    data-testid={`button-cancel-rename-${room.id}`}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className={`flex-1 text-xs py-2 truncate ${isActive ? "font-medium" : ""}`} data-testid={`text-room-title-${room.id}`}>
                    {room.title}
                  </span>
                  <div className="flex items-center gap-0.5 invisible group-hover:visible shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditId(room.id);
                        setEditTitle(room.title);
                      }}
                      data-testid={`button-rename-room-${room.id}`}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(room.id);
                      }}
                      data-testid={`button-delete-room-${room.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
