import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MessageCircle, Users, ArrowRight, Plus, LogIn } from "lucide-react";
import { API_URL } from "../socket";

export default function Home() {
  const [username, setUsername] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("one-to-one");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createRoom = async () => {
    if (!username.trim()) {
      toast.error("Enter your name first!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/room/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          roomName: roomName.trim() || undefined,
          type: roomType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Room created! ID: ${data.roomId}`);
      navigate(
        `/chat/${data.roomId}?username=${encodeURIComponent(username.trim())}`,
      );
    } catch (err) {
      toast.error(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    console.log("joinRoom called", { username, joinRoomId });
    if (!username.trim()) {
      toast.error("Enter your name first!");
      return;
    }
    if (!joinRoomId.trim()) {
      toast.error("Enter a Room ID!");
      return;
    }
    setLoading(true);
    try {
      const url = `${API_URL}/api/room/${joinRoomId.trim().toUpperCase()}`;
      console.log("Fetching:", url);
      const res = await fetch(url);
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);
      if (!res.ok) throw new Error(data.error);
      navigate(
        `/chat/${data.roomId}?username=${encodeURIComponent(username.trim())}`,
      );
    } catch (err) {
      toast.error(err.message || "Room not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">QuickChat</h1>
          <p className="text-gray-400">
            Instant room-based chat. No signup needed.
          </p>
        </div>

        {/* Username */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your display name"
            maxLength={30}
            required
            className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              username.trim() ? "border-gray-600" : "border-red-500/50"
            }`}
          />
          {!username.trim() && (
            <p className="text-xs text-red-400 mt-1.5">
              Name is required to create or join a room
            </p>
          )}
        </div>

        {/* Create Room */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6 mb-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            Create Room
          </h2>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name (optional)"
            maxLength={50}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
          />
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setRoomType("one-to-one")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                roomType === "one-to-one"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              1-to-1 Chat
            </button>
            <button
              onClick={() => setRoomType("group")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
                roomType === "group"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Users className="w-4 h-4" />
              Group Chat
            </button>
          </div>
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            Create Room
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-emerald-400" />
            Join Room
          </h2>
          <input
            type="text"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
            placeholder="Enter Room ID (e.g. A1B2C3D4)"
            maxLength={8}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent mb-3 uppercase tracking-widest text-center font-mono text-lg"
          />
          <button
            onClick={joinRoom}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
          >
            Join Room
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Share the Room ID with others to start chatting instantly
        </p>
      </div>
    </div>
  );
}
