// Vercel Serverless Function — /api/auth
// Chỉ kiểm tra mật khẩu, KHÔNG tiêu tốn quota LLM.

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { password } = body || {};

  const expected = process.env.ACCESS_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: "Server chưa cấu hình ACCESS_PASSWORD." });
  }

  if (password && password === expected) {
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ ok: false });
}
