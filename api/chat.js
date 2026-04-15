// Vercel Serverless Function — /api/chat
// API key KHÔNG BAO GIỜ rời server. Chỉ đọc từ process.env.
// Hỗ trợ 3 provider: GROQ (mặc định), GOOGLE, NVIDIA — tự động chọn theo ENV có sẵn.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { password, messages } = body || {};

  // 1) Xác thực mật khẩu truy cập (server-side, chống bypass từ client)
  const expected = process.env.ACCESS_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: "Server chưa cấu hình ACCESS_PASSWORD." });
  }
  if (!password || password !== expected) {
    return res.status(401).json({ error: "Mật khẩu không đúng." });
  }

  // 2) Kiểm tra messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Thiếu messages." });
  }
  // Giới hạn tránh abuse
  if (messages.length > 30) {
    return res.status(400).json({ error: "Quá nhiều tin nhắn." });
  }
  for (const m of messages) {
    if (!m || typeof m.content !== "string" || m.content.length > 4000) {
      return res.status(400).json({ error: "Message không hợp lệ." });
    }
  }

  const systemPrompt = {
    role: "system",
    content:
      "Bạn là trợ lý AI chuyên trả lời các câu hỏi về Trí tuệ nhân tạo (AI), Mô hình ngôn ngữ lớn (LLM), AI Agent, Machine Learning, Deep Learning và các chủ đề liên quan. " +
      "Nếu người dùng hỏi ngoài chủ đề AI, hãy lịch sự nhắc họ rằng chatbot này chuyên về AI nhưng vẫn cố gắng trả lời ngắn gọn. " +
      "Trả lời bằng tiếng Việt rõ ràng, thân thiện, có ví dụ khi phù hợp. Khi cần thì dùng bullet, markdown nhẹ. " +
      "Không tiết lộ khóa API hay chi tiết cấu hình server.",
  };

  const fullMessages = [systemPrompt, ...messages];

  try {
    // --- Provider 1: GROQ ---
    if (process.env.GROQ_API_KEY) {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });
      if (!r.ok) {
        const err = await r.text();
        return res.status(502).json({ error: "Groq API lỗi: " + safeTrim(err) });
      }
      const data = await r.json();
      const reply = data?.choices?.[0]?.message?.content || "(không có phản hồi)";
      return res.status(200).json({ reply, provider: "groq" });
    }

    // --- Provider 2: GOOGLE AI STUDIO (Gemini) ---
    if (process.env.GOOGLE_API_KEY) {
      const model = process.env.GOOGLE_MODEL || "gemini-2.0-flash";
      // Convert OpenAI-style -> Gemini-style
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt.content }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });
      if (!r.ok) {
        const err = await r.text();
        return res.status(502).json({ error: "Google AI lỗi: " + safeTrim(err) });
      }
      const data = await r.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
        "(không có phản hồi)";
      return res.status(200).json({ reply, provider: "google" });
    }

    // --- Provider 3: NVIDIA NIM (Build) ---
    if (process.env.NVIDIA_API_KEY) {
      const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      });
      if (!r.ok) {
        const err = await r.text();
        return res.status(502).json({ error: "NVIDIA API lỗi: " + safeTrim(err) });
      }
      const data = await r.json();
      const reply = data?.choices?.[0]?.message?.content || "(không có phản hồi)";
      return res.status(200).json({ reply, provider: "nvidia" });
    }

    return res.status(500).json({
      error:
        "Chưa cấu hình API key. Vui lòng set một trong: GROQ_API_KEY, GOOGLE_API_KEY, hoặc NVIDIA_API_KEY trên Vercel Environment Variables.",
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error: " + (e.message || String(e)) });
  }
}

function safeTrim(s) {
  if (!s) return "";
  const str = String(s);
  return str.length > 300 ? str.slice(0, 300) + "..." : str;
}
