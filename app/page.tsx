"use client";

import { useState } from "react";

type Result = {
  status?: "ready" | "needs_info";
  confidence?: "high" | "medium" | "low";
  missingInfo?: string[];
  questions?: string[];
  formula: string;
  explanation: string;
  howToUse: string;
  example: string;
  warning?: string;
};

const examples = [
  { label: "📊 良率公式", text: "A欄是投入數量，B欄是不良數量，我想算良率百分比，投入為0時顯示0%" },
  { label: "💰 加班費", text: "超過 8 小時算加班時數，超過的時數乘以 1.33" },
  { label: "🔍 VLOOKUP", text: "依照姓名查找對應薪資" },
  { label: "📅 日期差", text: "計算兩個日期相差幾天" },
  { label: "📝 IF 判斷", text: "A欄大於100顯示OK，否則顯示NG" },
  { label: "✅ 統計 NG", text: "統計B欄中出現NG的數量" },
];

export default function Home() {
  const [request, setRequest] = useState("超過 8 小時算加班費");
  const [tool, setTool] = useState("Excel");
  const [outputMode, setOutputMode] = useState("general");
  const [mode, setMode] = useState("generate");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [originalRequest, setOriginalRequest] = useState("");

  async function generateFormula() {
    setError("");
    setResult(null);
    setCopied(false);

    if (!request.trim()) {
      setError("請先輸入你的 Excel 需求。");
      return;
    }

    setLoading(true);
    setOriginalRequest(request);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, tool, outputMode, mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "產生失敗，請稍後再試。");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "產生失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  async function continueWithMoreInfo() {
  if (!followUp.trim()) {
    setError("請先補充缺少的資訊。");
    return;
  }

  const combinedRequest = `${originalRequest}

補充資訊：
${followUp}`;

  setRequest(combinedRequest);
  setFollowUp("");
  setResult(null);
  setCopied(false);
  setLoading(true);

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: combinedRequest, tool, outputMode, mode }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "產生失敗，請稍後再試。");
    }

    setResult(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : "產生失敗，請稍後再試。");
  } finally {
    setLoading(false);
  }
}

async function copyFormula() {
  if (!result?.formula) return;

  await navigator.clipboard.writeText(result.formula);

  setCopied(true);
  setTimeout(() => setCopied(false), 1600);
}

  return (
    <main>
      <section className="hero">
  <div className="badge">
  Excel Formula Assistant
</div>

  <h1>
  用中文描述需求
  <br />
  快速完成公式
</h1>

  <p className="subtitle">
    建立公式｜修正錯誤｜解釋公式｜最佳化公式
    <br />
  </p>

  <div className="hero-rating">
    支援 Excel 365、Excel 2021、Google Sheets
  </div>
</section>

      <section className="app-card">
        <label htmlFor="request">
  請輸入你的需求
</label>
        <textarea
          id="request"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
placeholder={`例如：

建立加班費公式

A欄投入數量、B欄不良數量，計算良率

修正這段 VLOOKUP 為什麼找不到資料

解釋這段 IF 公式

幫我把這個公式改成 XLOOKUP`}
                />

        <p className="input-hint">
          💡 不用擔心描述不完整，EverySheet 會自動詢問缺少的資訊。
        </p>

        <div className="mode-tabs">
  <button
    className={mode === "generate" ? "active" : ""}
    onClick={() => setMode("generate")}
  >
    ✨ 建立公式
  </button>

  <button
    className={mode === "fix" ? "active" : ""}
    onClick={() => setMode("fix")}
  >
    🛠 修正公式
  </button>

  <button
    className={mode === "explain" ? "active" : ""}
    onClick={() => setMode("explain")}
  >
    📖 解釋公式
  </button>

  <button
    className={mode === "optimize" ? "active" : ""}
    onClick={() => setMode("optimize")}
  >
    ⚡ 優化公式
  </button>
</div>
        
        <div className="controls">
          <select value={tool} onChange={(e) => setTool(e.target.value)} aria-label="選擇工具">
            <option>Excel</option>
            <option>Google Sheets</option>
          </select>
          <button onClick={generateFormula} disabled={loading}>
  {loading
    ? "AI 處理中..."
    : mode === "generate"
    ? "建立公式"
    : mode === "fix"
    ? "修正公式"
    : mode === "explain"
    ? "解釋公式"
    : "優化公式"}
</button>
        </div>

        <div className="mode-box">
          <div className="mode-title">
  結果呈現方式
</div>

          <label className={`mode-option ${outputMode === "general" ? "active" : ""}`}>
            <input
              type="radio"
              name="outputMode"
              value="general"
              checked={outputMode === "general"}
              onChange={(e) => setOutputMode(e.target.value)}
            />
            <div>
              <strong>😊 一般使用（推薦）</strong>
<span>
直接得到想要的結果，不用再調整格式。
</span>
            </div>
          </label>

          <label className={`mode-option ${outputMode === "professional" ? "active" : ""}`}>
            <input
              type="radio"
              name="outputMode"
              value="professional"
              checked={outputMode === "professional"}
              onChange={(e) => setOutputMode(e.target.value)}
            />
            <div>
              <strong>📊 專業 Excel</strong>
<span>
保留可計算數值，適合進一步分析與報表。
</span>
            </div>
          </label>
        </div>

        <div className="example-title">
  🔥 熱門需求（點一下即可開始）
</div>

<div className="examples">
  {examples.map((item) => (
    <button
      className="example-btn"
      key={item.label}
      onClick={() => setRequest(item.text)}
    >
      {item.label}
    </button>
  ))}
</div>

        {error && <div className="error">{error}</div>}
      </section>

      {result && (
        <section className="result-card">
          <div className="result-header">
            {result.status === "needs_info" && (
  <div className="mini-box">
    <h3>還需要補充資訊</h3>

    {result.missingInfo && result.missingInfo.length > 0 && (
      <>
        <p>缺少：</p>
        <ul>
          {result.missingInfo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    )}

    {result.questions && result.questions.length > 0 && (
      <>
        <p>請補充：</p>
        <ul>
          {result.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </>
    )}

    <textarea
      value={followUp}
      onChange={(e) => setFollowUp(e.target.value)}
      placeholder="例如：底薪在B欄，加班在C欄，每小時200元，津貼在D欄，全勤3000元"
    />

    <button onClick={continueWithMoreInfo} disabled={loading}>
      {loading ? "處理中..." : "補充後繼續產生公式"}
    </button>
  </div>
)}
            <h2>產生結果</h2>
            <button className="copy-btn" onClick={copyFormula}>
              {copied ? "已複製" : "複製公式"}
            </button>
          </div>

          {result.status !== "needs_info" && (
  <>
    <h3>公式</h3>
    <pre className="formula-box">{result.formula}</pre>
  </>
)}

          <div className="result-grid">
            <div className="mini-box">
              <h3>中文解釋</h3>
              <p>{result.explanation}</p>
            </div>
            <div className="mini-box">
              <h3>使用方式</h3>
              <p>{result.howToUse}</p>
            </div>
            <div className="mini-box">
              <h3>範例</h3>
              <p>{result.example}</p>
            </div>
            <div className="mini-box">
              <h3>提醒</h3>
              <p>{result.warning || "請依照你的實際欄位位置，把 A1、B2 等儲存格改成自己的表格位置。"}</p>
            </div>
          </div>
        </section>
      )}

      <section className="info-grid">
        <div className="info-card">
          <h3>適合誰？</h3>
          <p>上班族、行政、生管、財務、學生，只要常用 Excel 都能用。</p>
        </div>
        <div className="info-card">
          <h3>可以做什麼？</h3>
          <p>IF 判斷、VLOOKUP、XLOOKUP、SUMIFS、日期計算、加班費、良率、達成率。</p>
        </div>
        <div className="info-card">
          <h3>怎麼用？</h3>
          <p>用中文描述需求，複製公式，貼到 Excel 或 Google Sheets。</p>
        </div>
      </section>

      <footer>EverySheet © 2026</footer>
    </main>
  );
}
