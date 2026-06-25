"use client";

import { useState } from "react";

type Result = {
  formula: string;
  explanation: string;
  howToUse: string;
  example: string;
  warning?: string;
};

const examples = [
  "超過 8 小時算加班費",
  "A欄大於100顯示OK，否則顯示NG",
  "依照姓名查找對應薪資",
  "計算兩個日期相差幾天",
  "統計B欄中出現NG的數量",
  "A欄是投入數量，B欄是不良數量，我想算良率百分比，保留兩位小數，如果投入數量是0就顯示0%",
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

  async function generateFormula() {
    setError("");
    setResult(null);
    setCopied(false);

    if (!request.trim()) {
      setError("請先輸入你的 Excel 需求。");
      return;
    }

    setLoading(true);

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

  async function copyFormula() {
    if (!result?.formula) return;
    await navigator.clipboard.writeText(result.formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main>
      <section className="hero">
<div className="badge">Excel AI Copilot</div>

<h1>你的 AI Excel 工作夥伴</h1>

<p className="subtitle">
  建立公式、修正公式、解釋公式、優化公式，
  用自然語言就能完成 Excel 工作。
</p>
      </section>

      <section className="app-card">
        <label htmlFor="request">你想完成什麼？</label>
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

        <div className="mode-tabs">
  <button
    className={mode === "generate" ? "active" : ""}
    onClick={() => setMode("generate")}
  >
    建立公式
  </button>

  <button
    className={mode === "fix" ? "active" : ""}
    onClick={() => setMode("fix")}
  >
    修正公式
  </button>

  <button
    className={mode === "explain" ? "active" : ""}
    onClick={() => setMode("explain")}
  >
    解釋公式
  </button>

  <button
    className={mode === "optimize" ? "active" : ""}
    onClick={() => setMode("optimize")}
  >
    優化公式
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
          <div className="mode-title">輸出模式</div>

          <label className={`mode-option ${outputMode === "general" ? "active" : ""}`}>
            <input
              type="radio"
              name="outputMode"
              value="general"
              checked={outputMode === "general"}
              onChange={(e) => setOutputMode(e.target.value)}
            />
            <div>
              <strong>一般使用</strong>
              <span>直接顯示使用者想看的結果，例如 90.13%。適合大多數人。</span>
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
              <strong>專業 Excel</strong>
              <span>盡量保留數值，方便後續平均、排序、圖表、樞紐分析。</span>
            </div>
          </label>
        </div>

        <div className="examples">
          {examples.map((item) => (
            <button className="example-btn" key={item} onClick={() => setRequest(item)}>
              {item}
            </button>
          ))}
        </div>

        {error && <div className="error">{error}</div>}
      </section>

      {result && (
        <section className="result-card">
          <div className="result-header">
            <h2>產生結果</h2>
            <button className="copy-btn" onClick={copyFormula}>
              {copied ? "已複製" : "複製公式"}
            </button>
          </div>

          <h3>公式</h3>
          <pre className="formula-box">{result.formula}</pre>

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

      <footer>AI Excel Assistant © 2026</footer>
    </main>
  );
}
