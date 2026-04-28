import { useState } from "react";
import axios from "axios";

export default function Login({ setToken, setIsGuest }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "https://codereviewer-8xzy.onrender.com/api/login",
        { email, password }
      );

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      

    } catch {
      alert("Login failed");
    }
  };

  const handleGuest = () => {
  setIsGuest(true); // 🔥 THIS FIXES BLACK SCREEN
};

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-[#111] p-6 rounded w-80 space-y-4">

        <h2 className="text-lg font-bold text-center">Code Reviewer</h2>

        <input
          className="w-full p-2 bg-black border border-white/10 rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-2 bg-black border border-white/10 rounded"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 py-2 rounded hover:bg-blue-500"
        >
          Login
        </button>

        {/* 🔥 Google Login */}
        <a
          href="http://localhost:5000/auth/google"
          className="block text-center bg-red-600 py-2 rounded hover:bg-red-500"
        >
          Continue with Google
        </a>

        {/* 👤 Guest Mode */}
        <button
          onClick={handleGuest}
          className="w-full bg-gray-700 py-2 rounded hover:bg-gray-600"
        >
          Continue as Guest
        </button>

      </div>
    </div>
  );
}