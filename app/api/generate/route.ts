import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanFormula(formula: string) {
  const trimmed = String(formula || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("=") ? trimmed : `=${trimmed}`;
}

function getModeInstruction(mode: string) {
  if (mode === "fix") {
    return `目前模式：修正公式。
你的任務不是重新發明公式，而是幫使用者找出公式錯誤並修正。

請優先做到：
1. 判斷公式可能哪裡錯。
2. 解釋錯誤原因，例如括號錯誤、範圍錯誤、欄位數錯誤、#N/A、#VALUE!、#REF!。
3. 提供修正版公式。
4. 如果原公式邏輯不清楚，請保留原意並用合理假設修正。
5. explanation 說明錯誤原因。
6. howToUse 說明如何貼上修正版。
7. example 提供修正前與修正後的簡短比較。
8. warning 提醒使用者確認欄位範圍與工作表名稱。`;
  }

  if (mode === "explain") {
    return `目前模式：解釋公式。
你的任務不是產生新公式，而是把使用者貼上的 Excel 或 Google Sheets 公式用白話中文解釋清楚。

請優先做到：
1. formula 欄位放使用者原本的公式，如果原公式沒有 =，請補上 =。
2. explanation 用白話說明整體公式在做什麼。
3. howToUse 說明這個公式通常適合用在哪種資料情境。
4. example 用簡單資料舉例說明結果。
5. warning 提醒可能出錯的地方，例如範圍、欄位、空白、文字格式。`;
  }

  if (mode === "optimize") {
    return `目前模式：優化公式。
你的任務是讓使用者提供的公式更簡潔、更好維護或更有效率。

請優先做到：
1. 找出原公式可改善的地方，例如過長、重複計算、巢狀 IF 太多、VLOOKUP 可改 XLOOKUP、可用 LET 增加可讀性。
2. formula 欄位提供優化後公式。
3. explanation 說明為什麼這樣更好。
4. howToUse 說明如何替換原公式。
5. example 提供原公式與優化公式的差異。
6. warning 提醒版本相容性，例如 XLOOKUP、LET 在舊版 Excel 可能不能用。`;
  }

  return `目前模式：建立公式。
你的任務是根據使用者的中文需求，建立可直接貼到 Excel 或 Google Sheets 使用的公式。

請優先做到：
1. 產生可直接貼上的公式。
2. 清楚說明公式邏輯。
3. 明確說明 A1、B1、C1 等欄位代表什麼。
4. 如果需求資訊不足，請做合理假設並在 warning 說明。`;
}

export async function POST(req: Request) {
  try {
    const { request, tool, outputMode, mode } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "尚未設定 OPENAI_API_KEY。" }, { status: 500 });
    }

    if (!request || typeof request !== "string") {
      return NextResponse.json({ error: "請輸入需求。" }, { status: 400 });
    }

    const selectedTool = tool || "Excel";
    const selectedOutputMode = outputMode || "general";
    const selectedMode = mode || "generate";

    const outputInstruction =
      selectedOutputMode === "professional"
        ? `目前使用者選擇「專業 Excel」輸出。
請盡量保持結果為可計算的數值，不要用 TEXT() 把數字轉成文字。
例如百分比可回傳 =IF(A1=0,0,(A1-B1)/A1)，並在 howToUse 提醒使用者將儲存格格式設為百分比、小數兩位。`
        : `目前使用者選擇「一般使用」輸出。
請優先讓使用者貼上公式後就能直接看到想要的顯示結果。
如果使用者要求百分比、小數兩位、金額格式，可以使用 TEXT() 讓結果直接顯示成使用者期待的樣子。
但 warning 要提醒：若後續還要平均、排序、圖表或樞紐分析，建議改用專業 Excel 模式。`;

    const modeInstruction = getModeInstruction(selectedMode);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `你是 Excel Copilot，專門協助使用者處理 Excel / Google Sheets 工作。請用繁體中文回答。

你必須只輸出 JSON，不要使用 markdown，不要輸出 JSON 以外的任何文字。

JSON 格式如下：
{
  "formula": "公式本體或修正後公式，必須以 = 開頭；若模式是解釋公式，請放原公式",
  "explanation": "用白話中文解釋原因、邏輯或用途",
  "howToUse": "明確告訴使用者如何使用、貼在哪裡、需要改哪些儲存格",
  "example": "提供簡短範例",
  "warning": "提醒使用者注意欄位、版本、分隔符號或可能錯誤"
}

共同規則：
1. formula 一定要以 = 開頭。
2. 公式請符合使用者選擇的工具：Excel 或 Google Sheets。
3. 若使用 A1、B1、C1 等儲存格，必須在 howToUse 裡清楚說明每個儲存格代表什麼。
4. 不要使用未解釋的 B1、C1、D1。
5. 不要編造不存在的函數。
6. 若有地區分隔符號差異，提醒逗號可能需要改成分號。
7. 常用產業定義：
- 良率 = (投入數量 - 不良數量) / 投入數量
- 不良率 = 不良數量 / 投入數量
- 達成率 = 實際完成數量 / 目標數量
- 加班時數 = 總工時 - 8
8. 若使用者提到「良率」，不要回傳不良率公式。

${outputInstruction}

${modeInstruction}`,
        },
        {
          role: "user",
          content: `工具：${selectedTool}
輸出模式：${selectedOutputMode}
功能模式：${selectedMode}
使用者需求：
${request}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      return NextResponse.json({ error: "AI 沒有回傳內容。" }, { status: 500 });
    }

    const parsed = JSON.parse(text);

    return NextResponse.json({
      formula: cleanFormula(parsed.formula),
      explanation: parsed.explanation || "",
      howToUse: parsed.howToUse || "",
      example: parsed.example || "",
      warning: parsed.warning || "",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "產生公式時發生錯誤，請稍後再試。" }, { status: 500 });
  }
}
