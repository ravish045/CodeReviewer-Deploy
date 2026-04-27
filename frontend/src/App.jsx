import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Sparkles, Code2, RotateCcw, Bug, Wand2, Copy } from 'lucide-react';

function App() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editorRef, setEditorRef] = useState(null);

  const templates = {
    javascript: `function helloWorld() {\n  console.log("Hello Ravish");\n}`,
    cpp: `#include <iostream>\nusing namespace std;\nint main() {\n  int a = 10, b = 0;\n  cout << a / b;\n}`,
    python: `a = 10\nb = 0\nprint(a / b)`,
    c: `#include <stdio.h>\nint main() {\n  int a = 10, b = 0;\n  printf("%d", a / b);\n  return 0;\n}`,
     java: `class Main {\n  public static void main(String[] args) {\n    int a = 10, b = 0;\n    System.out.println(a / b);\n  }\n}`
  };

  useEffect(() => {
    setCode(templates[language]);
    setReview(null);
  }, [language]);

  // 🔥 Load history
  const [history, setHistory] = useState(() => {
    return JSON.parse(localStorage.getItem("history")) || [];
  });

  const saveToHistory = (data) => {
    const updated = [data, ...history.slice(0, 4)];
    setHistory(updated);
    localStorage.setItem("history", JSON.stringify(updated));
  };

  const handleReview = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/review`, {
        code,
        language
      });

      setReview(data);
      saveToHistory(data);

      // 🔴 Highlight simple error (example: division by zero)
      if (editorRef && code.includes("/ 0")) {
        const model = editorRef.getModel();
        window.monaco.editor.setModelMarkers(model, "owner", [
          {
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 5,
            endColumn: 1,
            message: "Possible division by zero",
            severity: window.monaco.MarkerSeverity.Error
          }
        ]);
      }

    } catch {
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
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-slate-300">

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

          <button
            onClick={handleReview}
            disabled={loading}
            className="bg-blue-600 px-5 py-2 rounded flex items-center gap-2"
          >
            {loading ? <RotateCcw className="animate-spin" /> : <Sparkles />}
            Review
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex flex-1 p-4 gap-4">

        {/* Editor */}
        <div className="flex-1 border border-white/10 rounded-xl overflow-hidden">
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={code}
            onMount={(editor) => setEditorRef(editor)}
            onChange={(val) => setCode(val)}
          />
        </div>

        {/* Output */}
        <div className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl p-6 overflow-y-auto">

          {!review && !loading && <p className="text-slate-600">Run review to see results</p>}

          {loading && <p>Analyzing...</p>}

          {review && (
            <div className="space-y-6">

              <h2 className="text-blue-400 text-sm">Review Summary</h2>
              <p className="text-white italic">{review.summary}</p>

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
                <h3 className="text-slate-400 text-sm mt-6 mb-2">Recent Reviews</h3>
                {history.map((item, i) => (
                  <div key={i} className="text-xs text-slate-500 border-b border-white/10 py-1">
                    {item.summary}
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

export default App;