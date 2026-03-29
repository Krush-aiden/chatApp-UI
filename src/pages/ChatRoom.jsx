import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Send,
  Paperclip,
  ArrowLeft,
  Copy,
  Users,
  X,
  FileText,
  Image as ImageIcon,
  Download,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { socket, API_URL } from "../socket";

export default function ChatRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");
  const navigate = useNavigate();

  // Redirect to home if no username
  useEffect(() => {
    if (!username || !username.trim()) {
      navigate("/");
    }
  }, [username, navigate]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [roomOwner, setRoomOwner] = useState("");
  const [roomEnded, setRoomEnded] = useState(false);
  const [roomType, setRoomType] = useState("");

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect & join room
  useEffect(() => {
    socket.connect();
    socket.emit("join_room", { roomId, username });

    socket.on("chat_history", (history) => {
      setMessages(history);
    });

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("room_info", ({ owner, type }) => {
      setRoomOwner(owner);
      setRoomType(type);
    });

    socket.on("user_joined", ({ users }) => {
      setOnlineUsers(users);
    });

    socket.on("user_left", ({ users }) => {
      setOnlineUsers(users);
    });

    socket.on("room_ended", ({ message }) => {
      setRoomEnded(true);
      toast.error(message, { duration: 6000 });
    });

    socket.on("user_typing", ({ username: typingUser }) => {
      setTypingUsers((prev) =>
        prev.includes(typingUser) ? prev : [...prev, typingUser],
      );
    });

    socket.on("user_stop_typing", ({ username: typingUser }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== typingUser));
    });

    socket.on("error_message", ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.off("chat_history");
      socket.off("receive_message");
      socket.off("room_info");
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("room_ended");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("error_message");
      socket.disconnect();
    };
  }, [roomId, username]);

  // Send text message
  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("send_message", {
      roomId,
      sender: username,
      message: input.trim(),
      type: "text",
    });
    socket.emit("stop_typing", { roomId, username });
    setInput("");
  };

  // Typing indicator
  const handleTyping = (e) => {
    setInput(e.target.value);
    socket.emit("typing", { roomId, username });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { roomId, username });
    }, 1500);
  };

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large! Max 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const isImage = file.type.startsWith("image/");
      socket.emit("send_message", {
        roomId,
        sender: username,
        message: "",
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        type: isImage ? "image" : "file",
      });
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied!");
  };

  const otherTyping = typingUsers.filter((u) => u !== username);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg leading-tight">
                Room: {roomId}
              </h1>
              {roomType && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    roomType === "one-to-one"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {roomType === "one-to-one" ? "1-to-1" : "Group"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">{onlineUsers.length} online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomId}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
            title="Copy Room ID"
          >
            <Copy className="w-4 h-4" />
            Copy ID
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-700 rounded-lg transition relative"
          >
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-indigo-500 text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {onlineUsers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Free-tier latency banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 shrink-0">
        <span className="text-amber-400 text-sm leading-none">⏳</span>
        <p className="text-amber-300 text-xs">
          Please allow up to 1 minute for login or account creation attempts due to free-tier limitations on Render.
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-1">No messages yet</p>
                  <p className="text-sm">
                    Share Room ID{" "}
                    <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">
                      {roomId}
                    </span>{" "}
                    for others to join
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.sender === "system") {
                return (
                  <div key={i} className="text-center">
                    <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                      {msg.message}
                    </span>
                  </div>
                );
              }

              const isMe = msg.sender === username;
              return (
                <div
                  key={msg._id || i}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? "bg-indigo-600 rounded-br-md"
                        : "bg-gray-700 rounded-bl-md"
                    }`}
                  >
                    {!isMe && (
                      <p className="text-xs font-semibold text-indigo-300 mb-1">
                        {msg.sender}
                      </p>
                    )}

                    {/* Image message */}
                    {msg.type === "image" && msg.fileUrl && (
                      <div className="mb-1">
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName}
                          className="max-w-full max-h-60 rounded-lg cursor-pointer"
                          onClick={() => window.open(msg.fileUrl, "_blank")}
                        />
                        <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {msg.fileName}
                        </p>
                      </div>
                    )}

                    {/* File message */}
                    {msg.type === "file" && msg.fileUrl && (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-black/20 rounded-lg p-3 hover:bg-black/30 transition"
                      >
                        <FileText className="w-8 h-8 text-gray-300 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {msg.fileName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {msg.fileType}
                          </p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400 shrink-0" />
                      </a>
                    )}

                    {/* Text */}
                    {msg.message && (
                      <p className="text-sm break-words">{msg.message}</p>
                    )}

                    <p
                      className={`text-[10px] mt-1 ${isMe ? "text-indigo-200" : "text-gray-400"}`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing indicator */}
          {otherTyping.length > 0 && !roomEnded && (
            <div className="px-4 py-1">
              <p className="text-xs text-gray-400 italic">
                {otherTyping.join(", ")}{" "}
                {otherTyping.length === 1 ? "is" : "are"} typing...
              </p>
            </div>
          )}

          {/* Room ended banner */}
          {roomEnded && (
            <div className="px-4 py-3 bg-red-900/30 border-t border-red-700 shrink-0">
              <div className="flex items-center gap-2 justify-center text-red-300">
                <AlertTriangle className="w-5 h-5" />
                <p className="text-sm font-medium">
                  Room owner has left. This chat has ended.
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="mt-2 w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
              >
                Go back to Home
              </button>
            </div>
          )}

          {/* Input bar */}
          {!roomEnded && (
            <div className="p-3 bg-gray-800 border-t border-gray-700 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2.5 hover:bg-gray-700 rounded-xl transition disabled:opacity-50"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={
                    uploading ? "Uploading file..." : "Type a message..."
                  }
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || uploading}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Online Users */}
        {showSidebar && (
          <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="font-semibold">Online Users</h3>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {onlineUsers.map((user, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg"
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="text-sm truncate flex-1">
                    {user.username} {user.username === username && "(You)"}
                  </span>
                  {user.isOwner && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full">
                      <Crown className="w-3 h-3" />
                      Owner
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
