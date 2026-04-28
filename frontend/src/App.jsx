import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import Login from "./pages/login";
import { Sparkles, Code2, RotateCcw, Bug, Wand2, Copy } from 'lucide-react';
import { motion } from "framer-motion";
import toast from "react-hot-toast";

function App() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editorRef, setEditorRef] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const API = "http://localhost:5000";

  const templates = {
    javascript: `function helloWorld() {\n  console.log("Hello Ravish");\n}`,
    cpp: `#include <iostream>\nusing namespace std;\nint main() {\n  int a = 10, b = 0;\n  cout << a / b;\n}`,
    python: `a = 10\nb = 0\nprint(a / b)`,
    c: `#include <stdio.h>\nint main() {\n  int a = 10, b = 0;\n  printf("%d", a / b);\n  return 0;\n}`,
     java: `class Main {\n  public static void main(String[] args) {\n    int a = 10, b = 0;\n    System.out.println(a / b);\n  }\n}`
  };
 useEffect(() => {
  if (token && token !== "guest") {
    axios.get(`${API}/api/me`, {
      headers: { Authorization: token }
    }).then(res => setUser(res.data));

    axios.get(`${API}/api/history`, {
      headers: { Authorization: token }
    }).then(res => setHistory(res.data));
  } else {
    setUser(null);
    setHistory([]);
  }
}, [token]);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");
  
  if (urlToken) {
    localStorage.setItem("token", urlToken);
    setToken(urlToken);
  }
}, []);

  useEffect(() => {
    setCode(templates[language]);
    setReview(null);
  }, [language]);

 

  

  const handleReview = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/review`, {
        code,
        language,
        
      },
    {
      headers: {
          Authorization: token
        }
    });
      

      setReview(data);
      

      // 🔴 Highlight simple error (example: division by zero)
      if (editorRef && code.includes("/ 0")) {
        const model = editorRef.getModel();
        window.monaco.editor.setModelMarkers(model, "owner", [
          {
            startLineNumber: 2,
            startColumn: 2,
            endLineNumber: 5,
            endColumn: 2,
            message: "Possible division by zero",
            severity: window.monaco.MarkerSeverity.Error
          }
        ]);
      }

    } catch (err) {
  console.log("ERROR 👉", err.response?.data || err.message);
  alert("Backend error!");
}
    setLoading(false);
  };
  
  const handleFixCode = () => {
    if (review?.optimizedCode) {
      setCode(review.optimizedCode);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(review?.optimizedCode || "");
    toast.success("Copied!");
  };
  if (!token && !isGuest) {
    return <Login setToken={setToken} setIsGuest={setIsGuest} />;
  }
  
  
  return (
    
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="h-screen flex flex-col bg-[#050505] text-slate-300"
  >

      {/* Header */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <Sparkles className="text-white" size={18} />
          </div>
          <span className="text-xl font-bold text-white">Code Reviewer</span>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#111] border border-white/10 px-3 py-2 rounded"
          >
            <option value="javascript">JS</option>
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="c">C</option>
            <option value="java">Java</option>
          </select>
          <div className="flex items-center gap-4">

  {user && (
    <span className="text-sm text-slate-400">
      {user.email}
    </span>
  )}

  <button
    onClick={() => {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setIsGuest(false);
    }}
    className="bg-red-600 px-3 py-1 rounded"
  >
    Logout
  </button>

</div>

          <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={handleReview}
  className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 rounded flex items-center gap-2"
>
            {loading ? <RotateCcw className="animate-spin" /> : <Sparkles />}
            Review
          </motion.button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex flex-1 p-4 gap-4">
        <div className="relative">
  <div className="pointer-events-none fixed inset-0 z-0">
    <div className="absolute w-96 h-96 bg-blue-500/10 blur-3xl rounded-full top-1/4 left-1/4"></div>
  </div>
</div>

        {/* Editor */}
        <motion.div
  key={language}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
  className="flex-1 border border-white/10 rounded-xl overflow-hidden"
>
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={code}
            onMount={(editor) => setEditorRef(editor)}
            onChange={(val) => setCode(val)}
          />
        </motion.div>

        {/* Output */}
        <motion.div
  whileHover={{ scale: 1.01 }}
  className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl p-6 overflow-y-auto"
>

          {!review && !loading && <p className="text-slate-600">Run review to see results</p>}

          {loading && <p>Analyzing...</p>}

          {review && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="space-y-6"
  >

              <div className="bg-white/5 p-3 rounded">
  <p className="text-sm text-blue-400 mb-1">Summary</p>
  <p className="text-white">{review.summary}</p>
</div>

              <div>
                <h3 className="text-slate-400 text-sm mb-2">Improvements</h3>
                {review.details?.map((d, i) => (
                  <div key={i} className="p-2 bg-white/5 rounded mb-2 flex gap-2">
                    <Bug size={14} /> {d}
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-slate-400 text-sm mb-2">Optimized Code</h3>

                <div className="flex gap-2 mb-2">
                  <button onClick={handleFixCode} className="bg-green-600 px-3 py-1 rounded flex gap-1">
                    <Wand2 size={14}/> Fix Code
                  </button>

                  <button onClick={copyCode} className="bg-gray-700 px-3 py-1 rounded flex gap-1">
                    <Copy size={14}/> Copy
                  </button>
                </div>

                <pre className="bg-black p-4 text-green-400 text-xs rounded">
                  {review.optimizedCode || "No optimized code"}
                </pre>
              </div>

              {/* History */}
              <div>
  <h3 className="text-slate-400 text-sm mt-6 mb-2">History</h3>

  {!token && (
    <p className="text-xs text-red-400">
      Login to save and view history
    </p>
  )}

  {token && history.length === 0 && (
    <p className="text-xs text-slate-500">No history yet</p>
  )}

  {history.map((item, i) => (
    <div
      key={i}
      className="p-3 bg-white/5 rounded mb-2 cursor-pointer hover:bg-white/10"
      onClick={() => setCode(item.code)}
    >
      <p className="text-xs text-blue-400">{item.status}</p>
      <p className="text-xs text-slate-400 truncate">{item.summary}</p>
    </div>
  ))}
</div>

            </motion.div>
          )}

        </motion.div>

      </main>
    </motion.div>
  );
}

export default App;