# 🤖 AI Chatbot — Hỏi đáp về AI & AI Agent

Chatbot đơn giản, **bảo mật API key đúng chuẩn** (chỉ chạy server-side trên Vercel), có **mật khẩu truy cập** để chỉ người được phép mới vào chat được.

## Tính năng

- Giao diện chat gọn, đẹp, hỗ trợ tiếng Việt.
- Mật khẩu truy cập trang (server xác thực, không chỉ che bằng JS phía client).
- API key LLM lưu ở **Environment Variables trên Vercel** — không bao giờ xuất hiện trong mã client.
- Hỗ trợ 3 provider miễn phí: **Groq** (mặc định, nhanh nhất), **Google AI Studio (Gemini)**, **NVIDIA Builder**. Tự chọn provider dựa trên env key nào được set.
- Giới hạn độ dài message & số lượt chat per request để tránh bị lạm dụng API key.

## Cấu trúc

```
chatbot-ai/
├── api/
│   ├── auth.js        ← xác thực mật khẩu
│   └── chat.js        ← proxy gọi LLM (giữ API key server-side)
├── index.html         ← giao diện
├── vercel.json
├── package.json
└── README.md
```

---

## 🚀 Hướng dẫn deploy (khoảng 5 phút)

### Bước 1 — Lấy API key miễn phí (chọn 1 trong 3)

**🟢 Groq (đề xuất — nhanh, dễ nhất):**
1. Vào https://console.groq.com/keys
2. Đăng ký bằng Google/GitHub
3. Bấm **Create API Key** → copy chuỗi `gsk_...`

**Google AI Studio (Gemini):**
1. Vào https://aistudio.google.com/apikey
2. Đăng nhập Google → **Create API key**

**NVIDIA Builder:**
1. Vào https://build.nvidia.com/
2. Đăng ký → vào model bất kỳ (ví dụ Llama) → **Get API Key**

### Bước 2 — Upload code lên GitHub

1. Tạo repo mới trên https://github.com/new (đặt tên ví dụ `ai-chatbot`).
2. Trong thư mục `chatbot-ai/`, chạy:
   ```bash
   git init
   git add .
   git commit -m "AI chatbot"
   git branch -M main
   git remote add origin https://github.com/<your-username>/ai-chatbot.git
   git push -u origin main
   ```

### Bước 3 — Deploy lên Vercel

1. Vào https://vercel.com/new
2. Import repo GitHub vừa tạo.
3. **KHÔNG** bấm Deploy ngay — xuống phần **Environment Variables**, thêm:

   | Name              | Value                                   | Bắt buộc? |
   |-------------------|-----------------------------------------|-----------|
   | `ACCESS_PASSWORD` | Mật khẩu bạn tự đặt để đưa cô giáo test | ✅ luôn phải có |
   | `GROQ_API_KEY`    | Key Groq dạng `gsk_...`                 | Chọn 1 trong 3 |
   | `GOOGLE_API_KEY`  | Key Google AI Studio                    | Chọn 1 trong 3 |
   | `NVIDIA_API_KEY`  | Key NVIDIA dạng `nvapi-...`             | Chọn 1 trong 3 |

   (Tuỳ chọn) Có thể override model:
   - `GROQ_MODEL` (mặc định: `llama-3.3-70b-versatile`)
   - `GOOGLE_MODEL` (mặc định: `gemini-2.0-flash`)
   - `NVIDIA_MODEL` (mặc định: `meta/llama-3.3-70b-instruct`)

4. Bấm **Deploy**. Chờ ~30 giây.
5. Vercel cho bạn một URL dạng `https://ai-chatbot-xxxx.vercel.app` → đây là **link chatbot** để gửi cho cô giáo.

### Bước 4 — Gửi cho cô giáo

- **Link chatbot:** `https://ai-chatbot-xxxx.vercel.app`
- **Mật khẩu truy cập:** giá trị bạn đặt ở `ACCESS_PASSWORD`

---

## 🔐 Ghi chú bảo mật

Tại sao cách làm này **an toàn**:

1. API key KHÔNG có trong `index.html` hay JavaScript client → mở DevTools cũng không thấy.
2. Tất cả cuộc gọi LLM đi qua `/api/chat` (serverless function) — chỉ server đọc `process.env.GROQ_API_KEY`.
3. `/api/chat` **bắt buộc** phải kèm `password` đúng, nếu sai trả 401 ngay, không gọi LLM → không tốn quota.
4. Giới hạn 30 message/request, 4000 ký tự/message → giảm rủi ro lạm dụng.
5. `ACCESS_PASSWORD` được so sánh **server-side**, không có cách bypass từ client.

Không làm thế này: **KHÔNG** hardcode API key vào `index.html`, **KHÔNG** expose key qua biến `NEXT_PUBLIC_*` hay `VITE_*` — những tiền tố đó bị Vercel bundle vào client.

## 🧪 Chạy thử local (tuỳ chọn)

```bash
npm i -g vercel
cd chatbot-ai
vercel dev
```
Tạo file `.env` (không commit) với các biến ở trên, sau đó mở http://localhost:3000.

## 🛠️ Tuỳ biến

- **Đổi model**: sửa env `GROQ_MODEL` / `GOOGLE_MODEL` / `NVIDIA_MODEL` trên Vercel.
- **Đổi system prompt**: sửa biến `systemPrompt.content` trong `api/chat.js`.
- **Đổi giao diện**: chỉnh CSS trong `index.html`.
