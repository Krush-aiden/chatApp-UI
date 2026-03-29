import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import ChatRoom from "./pages/ChatRoom.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat/:roomId" element={<ChatRoom />} />
    </Routes>
  );
}
