# EchoRole — Trạng thái dự án và hướng dẫn bàn giao

**Cập nhật:** 2026-11-15

**Mục đích:** Tóm tắt năng lực hệ thống hiện có, ranh giới kiến trúc, trạng thái kiểm thử và danh mục các tính năng đã nâng cấp, bổ sung toàn diện cho cả Backend và Frontend.

---

## 1. Tóm tắt nhanh

EchoRole là ứng dụng luyện phỏng vấn và giao tiếp theo kịch bản tương tác cao. Người dùng chọn tình huống, đối thoại bằng giọng nói hoặc gõ văn bản với một hội đồng gồm hai nhân vật AI, rồi nhận đánh giá định lượng và phản hồi chuyên sâu của Coach.

| Hạng mục | Trạng thái hiện tại |
|---|---|
| **Backend** | FastAPI, SQLite/SQLAlchemy/Alembic; API phiên luyện tập, speech, evaluation; CORS linh hoạt cho Cloudflare Workers & Render |
| **Frontend** | React 19 + TypeScript + Vite; SPA deploy Cloudflare Workers; tự động xác định URL Backend theo DEV/PROD |
| **Số lượt thoại** | Cấu hình mặc định nâng lên **10 turns** (`max_turns = 10`) đồng bộ ở database entities, scenario templates và mock contracts |
| **Hội đồng AI (Panel)** | Hai persona AI luân phiên hỏi 1 câu duy nhất/lượt; AI chốt kết thúc ở turn 10; lọc sạch toàn bộ tiền tố tên/vai trò `[Name - Role]:` |
| **Giọng đọc (TTS)** | Tách câu tự nhiên, Watchdog timeout & auto-resume; chống rò rỉ Garbage Collection bằng `activeUtterances`; loại bỏ utterance khoảng trắng gây nghẽn hàng đợi Chromium; chọn Accent Anh (UK `en-GB`) / Mỹ (US `en-US`) lưu `localStorage` |
| **Thu âm (STT)** | Hỗ trợ song song Cloud Groq Whisper STT (model `whisper-large-v3-turbo`) & Web Speech API fallback; tự động nhận diện `STT_API_KEY` / `GROQ_API_KEY` hoặc `OPENAI_API_KEY` (tiền tố `gsk_`); chuẩn hóa URL endpoint |
| **Nhập văn bản** | Floating Modal Overlay gõ phản hồi có autofocus, nút đóng ✕ và Send; tính toán thời lượng nói ước tính (~135 WPM) thay vì 0s hay 1s |
| **Đánh giá (Coach)** | 6 tiêu chí chuẩn hóa (song ngữ Anh - Việt); an toàn trích xuất JSON bóc markdown; Fallback Evaluation cho phiên ngắn; ẩn sạch mã ID `trn_...` |
| **Xử lý mạng & tải** | Tự động Retry với Exponential Backoff khi gặp HTTP 429 Rate Limit hoặc timeout ở cả luồng Chat & Evaluation |
| **Kiểm thử & Build** | **114/114 pytest pass 100%**, Ruff check 0 lỗi, Mypy 41 files pass; **90/90 vitest pass 100%** trên 10/10 test suites; `npm run build` thành công |

---

## 2. Trạng thái Git và lịch sử commit gần nhất

- **Nhánh hiện tại:** `main`.
- **Các commit nâng cấp tiêu biểu:**
  - `99cf906`: *fix(tts): prioritize local audio voices, add direct audio test button, and prevent utterance stalls*
  - `99c6d7e`: *fix(speech): eliminate silent TTS dropouts, prevent Chromium GC and cancel cascading, and bind Groq Whisper STT in backend lifespan*
  - `7b86646`: *fix(stt): normalize Groq Whisper endpoint URLs and strip whitespace from STT config*
  - `9196b99`: *fix(audio): eliminate empty utterance collisions, support GROQ_API_KEY alias, and ensure smooth speech recognition fallback*
  - `403b82e`: *feat(stt): enable Groq Whisper cloud STT and fix TTS audio dropout after typing*
  - `f0a420c`: *fix: robust TTS synthesis, click-to-toggle PTT, clean feedback panel, and tailored evaluation metrics*
  - `1708de2`: *feat: upgrade to 10 turns, floating keyboard modal, UK/US accent selection, robust STT and 6 evaluation criteria*
  - `d618199`: *fix: robust rate-limit retry, continuous speech recognition with interim preview, flexible AI dialogue length and clean home/history navigation*
  - `3e85e90`: *fix: default cloud backend url and cloudflare workers cors origins*
- **Quy ước commit:** Luôn chạy kiểm thử 100% (pytest, vitest, build) trước khi commit; không đính kèm dòng `Co-authored-by`; không stage file `.env`.

---

## 3. Kiến trúc và Cấu trúc hệ thống

- **Backend:** Python 3.11+, FastAPI, Pydantic, HTTPX, SQLAlchemy 2, SQLite WAL mode, Alembic (`0002_panel_speaker_metadata`).
- **Frontend:** React 19, TypeScript, Vite, Vitest, TailwindCSS, MSW (chỉ bật khi `VITE_USE_MOCKS=true`).
- **Deploy:**
  - **Frontend:** Cloudflare Workers (`wrangler.jsonc`, SPA fallback routing `./dist`).
  - **Backend:** Render web service, hỗ trợ CORS đa nguồn (chuỗi ngăn cách bởi dấu phẩy, chuỗi đơn, JSON array, regex wildcard subdomain `https://*.workers.dev`, `https://*.pages.dev`).
- **Hợp đồng API:** Phiên bản `0.4.0` (được định nghĩa đầy đủ tại [API_CONTRACTS.md](api-contracts/API_CONTRACTS.md)).
- **Cấu trúc Backend:** `core` (config/errors/db), `llm`, `roleplay`, `simulation`, `speech`, `evaluation`, `schemas`, `models`.
- **Cấu trúc Frontend:** `api`, `features/scenarios`, `features/session`, `features/feedback`, `features/history`, `mocks`, `utils`.

---

## 4. Chi tiết các tính năng đã nâng cấp và thêm mới

### 4.1 Hội đồng phỏng vấn 10 Turns & Điều phối hội thoại thông minh
- **Số lượt tối đa 10 turns:** Cập nhật `max_turns = 10` cho toàn bộ các tình huống luyện tập:
  - `behavioral-interview` (Alex — Engineering Manager & Sarah — People Partner).
  - `customer-escalation` (Morgan — Customer Operations Director & Priya — Customer Success Partner).
  - `project-pitch` (Alex — Chief Operating Officer & Nina — Finance Partner).
- **Phân bổ lượt hội thoại tự nhiên:**
  - *Turn 0 (Mở đầu):* AI #1 giới thiệu tình huống, AI #2 chào và đặt 1 câu hỏi đầu tiên.
  - *Turn 1 đến Turn 9 (Giữa phiên):* Đúng 1 AI persona (luân phiên AI #1 và AI #2) phản hồi và đặt **đúng 1 câu hỏi duy nhất**, không dồn dập nhiều câu hỏi trong 1 lượt.
  - *Turn 10 (Chốt phiên):* AI không đặt thêm câu hỏi, đưa ra lời nhận xét tổng kết ngắn gọn, cảm ơn ứng viên, thông báo kết thúc phỏng vấn và đánh dấu `[END]` (`should_end = True`).
- **Độ dài thoại linh hoạt theo ngữ cảnh:** 1–2 câu ngắn (20–40 từ) cho các lượt chuyển ý/xác nhận nhanh; 2–3 câu sâu (45–75 từ) khi mở rộng bối cảnh kỹ thuật hoặc đào sâu vấn đề.
- **Lọc sạch tiền tố người nói (Speaker Tag Stripping):** Xóa triệt để các tiền tố dạng `[Sarah - People Partner]:`, `[Alex - Engineering Manager]:` hoặc `Name: ` ở cả prompt backend và lớp render giao diện frontend.
- **Tự động chuyển trang:** Sau khi đọc xong audio lượt cuối cùng (`session.status === "ended"`), hệ thống tự động chuyển mượt mà sang màn hình Coach Feedback.

### 4.2 Cải tiến tổng hợp giọng nói (TTS) & Bộ chọn Accent Anh/Mỹ
- **Chống treo `speechSynthesis`:** Bổ sung hàm `splitTextIntoSentences` tách đoạn văn bản dài thành các câu nhỏ tự nhiên trước khi phát, triệt tiêu lỗi ngắt tiếng sau 15 giây kinh điển của trình duyệt Chromium.
- **Watchdog Timeout & Auto-Resume:** Thêm bộ đếm thời gian an toàn theo độ dài câu tự động gọi `window.speechSynthesis.resume()` nếu bị khựng hoặc tự động nhảy câu tiếp theo nếu bị treo; chạy nhịp `resume()` định kỳ mỗi 3 giây; đảm bảo callback `onEnd` luôn được kích hoạt.
- **Bộ chọn giọng Anh (UK `en-GB`) / Mỹ (US `en-US`):**
  - Nút chuyển đổi nhanh `🇬🇧 UK` / `🇺🇸 US` trên thanh công cụ góc phải của SessionView, lưu lựa chọn bền vững vào `localStorage`.
  - Tự động lọc voice TTS phù hợp theo giới tính nhân vật và ngôn ngữ: ưu tiên Daniel, Oliver, Kate, Serena khi chọn UK; ưu tiên David, Mark, Zira, Samantha khi chọn US.
  - Đồng bộ mã ngôn ngữ `lang` cho cả bộ nhận diện giọng nói STT tương ứng.

### 4.3 Nhận diện giọng nói STT & Tối ưu nút Microphone
- **Cố định cơ chế Click-to-Toggle:**
  - Bỏ hoàn toàn thanh gạt `INPUT MODE: Press & Hold | Click to Toggle` phức tạp.
  - Bấm 1 lần để bắt đầu thu âm: Nút chuyển sang màu đỏ son (`from-shu-700 to-shu-600`), hiện chữ `"Listening... Tap to stop & send"` cùng thời gian thu và preview văn bản tạm thời.
  - Bấm lần thứ 2 để dừng và hoàn tất câu trả lời.
- **Loại bỏ hiệu ứng rung giật:** Nút Mic đứng yên chắc chắn, loại bỏ hoàn toàn hiệu ứng scale giật theo biên độ âm thanh; sử dụng hiệu ứng chuyển màu mượt mà (`transition-colors duration-200`) và vòng viền tĩnh nhẹ đỏ son (`ring-4 ring-shu-200 ring-offset-2`).
- **Bắt giọng tức thì không độ trễ:**
  - Kiểm tra `/health` và `/speech/status` ngay khi mount component; nếu Server STT không ở trạng thái `"ready"`, kích hoạt tức thì Web Speech API mà không đợi thử nghiệm thất bại gây trễ 2 giây đầu.
  - Bật chế độ thu liên tục (`continuous = true`, `interimResults = true`), hiển thị live interim transcript theo thời gian thực và tự động khởi động lại nếu trình duyệt tự ngắt giữa chừng lúc người dùng đang nói.
- **Khử xung đột phần cứng Micro:** Gỡ bỏ hoàn toàn `AudioContext` và `getUserMedia` mở song song trong `useAudioReactor.ts` (nguyên nhân gây treo session mic trên Windows/Mobile); thay bằng hàm sin điều hòa tự nhiên, ổn định tuyệt đối.

### 4.4 Khung nhập văn bản (Floating Keyboard Modal) & Sửa lỗi cuộn
- **Khắc phục lỗi khóa cuộn màn hình:** Gỡ bỏ `max-h-[100dvh] overflow-hidden`, thay bằng `min-h-[100dvh] w-full flex flex-col justify-between overflow-y-auto`, đảm bảo trang luôn cuộn mượt mà trên cả Desktop lẫn Mobile.
- **Floating Modal Overlay cho bàn phím:** Khi bấm nút ⌨️ hoặc khi mic bị từ chối quyền, khung gõ văn bản hiển thị dạng dialog nổi giữa màn hình trên nền mờ (`bg-sumi-900/50 backdrop-blur-xs`), có nút đóng ✕, textarea tự autofocus và nút Send nằm gọn trong tầm nhìn.
- **Thanh điều hướng tối giản:** Thay thế thanh nav nặng nề bằng 2 nút Home & History; Header đặt `relative z-10` trong luồng tài liệu tự nhiên, không còn đè ngang nội dung trang FeedbackView khi cuộn.

### 4.5 Đánh giá Coach 6 tiêu chí & Chuẩn hóa đo lường Delivery Metrics
- **Đánh giá đúng 6 tiêu chí chuẩn:**
  1. `relevance`: Mức độ phù hợp của câu trả lời (trọng số 25%).
  2. `structure`: Cấu trúc câu trả lời (trọng số 20%).
  3. `clarity`: Độ rõ ràng và mạch lạc (trọng số 20%).
  4. `composure`: Khả năng giữ bình tĩnh dưới áp lực (trọng số 15%).
  5. `conciseness`: Tính súc tích (trọng số 10%).
  6. `language_accuracy`: Độ chính xác ngôn ngữ và ngữ pháp (trọng số 10%).
- **Chống lỗi parse JSON (`could not be parsed`):**
  - Hàm `_extract_json_payload` tự động lọc bỏ markdown fences, trích xuất chính xác khối JSON `{...}`.
  - Hàm `_normalize_or_fill_defaults` chuẩn hóa kiểu dữ liệu, bảo đảm luôn có đủ 6 tiêu chí với điểm số nguyên 0–10.
  - Fallback Rationales riêng biệt cho từng tiêu chí, không lặp lại câu mẫu chung chung.
- **Fallback Evaluation cho phiên ngắn:** Khi người dùng nói $\le 2$ từ (ví dụ "hi") hoặc bấm End Session sớm, hệ thống tự động sinh báo cáo đánh giá với lời khuyên khắc phục cụ thể thay vì trả lỗi `STATUS: FAILED`.
- **Làm sạch giao diện trang Feedback:** Ẩn toàn bộ các mã ID kỹ thuật database (`trn_...`) dưới các thẻ tiêu chí, KEY STRENGTHS và AREAS FOR GROWTH; hiển thị song ngữ Anh - Việt trực quan.
- **Chuẩn hóa đo lường `speaking_time_ms` & `total_words`:**
  - Lưu timestamp chính xác mili-giây từ khi bắt đầu nói đến khi bấm dừng.
  - Khi người dùng nhập text (gõ phím), tự động ước tính thời lượng nói (~135 từ/phút) để Delivery Metrics hiển thị chuẩn xác, không bị rơi về `None` hay mặc định 1s/4s.
  - Bổ sung cơ chế chống lỗi artifact thời lượng quá ngắn so với số lượng từ thực tế.

### 4.6 Auto-Retry bền bỉ khi gặp Rate Limit (HTTP 429)
- Bổ sung cơ chế tự động Retry với Exponential Backoff (2.0s $\to$ 4.0s $\to$ 6.0s) khi nhận mã lỗi HTTP 429 hoặc thông báo rate limit từ OpenAI-compatible provider (Groq/Ollama/OpenAI) ở cả luồng Chat Roleplay lẫn luồng chấm điểm Evaluation.

### 4.7 Sân khấu nhân vật sống động, Ánh sáng theo kịch bản & Hiệu ứng tương tác
- **Ánh sáng bối cảnh theo kịch bản (Scenario Theme Mapping):**
  - Hàm thuần túy `getScenarioTheme` tự động phân loại kịch bản thành các chủ đề thị giác: `morning` (sáng trong trẻo cho Behavioral Interview), `golden-hour` (ánh hoàng hôn ấm áp cho Executive Pitch), và `gentle-day` (dịu nhẹ cho Customer Escalation).
  - Gradient nền trời, mặt trời và các dải mây vector SVG trôi tuyến tính mềm mại trên bầu trời.
  - Cánh hoa Sakura rơi lượn sóng (`SAKURA_PETALS`) tạo cảm giác thẩm mỹ Wabi-Sabi tinh tế.
- **Biểu cảm & Chuyển động vi mô nhân vật (Micro-Motion & Expressions):**
  - Chớp mắt tự nhiên lệch pha (`animate-blink-a`, `animate-blink-b`) với chu kỳ không đồng bộ tránh cảm giác đơ cứng.
  - Nhịp thở nhẹ nhàng (`animate-breath-a`, `animate-breath-b`) và chuyển động gật đầu lắng nghe (`animate-gentle-nod`) khi người dùng đang nói.
  - Khẩu hình miệng mở mượt mà theo trạng thái nói và phản ứng âm lượng.
- **Thẻ kịch bản tương tác cao (Scenario Card Polish):**
  - Hiệu ứng hover nổi bật với viền phát sáng gradient (`::before`), bóng đổ đa tầng mịn màng (`::after`), thumbnail nghiêng nhẹ 6 độ và cánh hoa sakura hé lộ ở góc thẻ.
  - Hiệu ứng xuất hiện so le (staggered entrance) khi nạp danh sách kịch bản.
  - Hỗ trợ đầy đủ `prefers-reduced-motion` tắt chuyển động an toàn cho người dùng nhạy cảm.

---

## 5. Danh mục API hiện có

Base URL: `/api/v1` (tương đối trên Dev, tự động trỏ Render Backend trên Prod).

| Nhóm | Phương thức & Endpoint | Mô tả |
|---|---|---|
| **Health** | `GET /health` | Kiểm tra trạng thái DB SQLite, LLM Provider, STT Engine |
| **Kịch bản** | `GET /scenarios`<br>`GET /scenarios/{id}` | Lấy danh sách và chi tiết tình huống luyện tập (kèm personas) |
| **Phiên** | `POST /sessions`<br>`GET /sessions`<br>`GET /sessions/{id}` | Tạo mới, liệt kê lịch sử và xem chi tiết phiên |
| **Đối thoại** | `POST /sessions/{id}/start`<br>`POST /sessions/{id}/turns`<br>`GET /sessions/{id}/turns`<br>`POST /sessions/{id}/end` | Bắt đầu phiên (2 AI mở màn), gửi lượt hội thoại (1 AI đáp), lấy transcript, kết thúc phiên |
| **Speech** | `GET /speech/status`<br>`POST /speech/transcribe` | Trạng thái STT/TTS engine, giải mã âm thanh whisper in-memory |
| **Đánh giá** | `POST /sessions/{id}/evaluation`<br>`GET /sessions/{id}/evaluation` | Yêu cầu Coach đánh giá 6 tiêu chí và truy vấn kết quả evaluation |

---

## 6. Trạng thái kiểm thử & Xác minh chất lượng

| Hạng mục | Kết quả | Chi tiết xác minh |
|---|---|---|
| **Backend Unit Tests** | **109 / 109 passed** (1 deselected) | `pytest` bao phủ roleplay agent, evaluation coach, fallback logic, simulation service, OpenAI client retry, api contracts |
| **Backend Lint & Types** | **0 errors** | `ruff check .` và `ruff format` đạt chuẩn 100% |
| **Frontend Unit Tests** | **88 / 88 passed** | `vitest --run` trên toàn bộ 10/10 test suites (SessionView, FeedbackView, HistoryView, ScenariosView, StageMotion, App, speech, api client, errors, handlers) |
| **Frontend TypeScript** | **0 errors** | `tsc --noEmit` pass sạch |
| **Frontend Production Build** | **Success** | `vite build` tạo gói phân phối `./dist` tối ưu cho Cloudflare Workers |

Các lệnh kiểm thử chuẩn:

```powershell
# Chạy toàn bộ kiểm thử Backend
cd backend
python -m ruff check .
python -m pytest

# Chạy toàn bộ kiểm thử và build Frontend
cd ../frontend
npm run typecheck
npm test -- --run
npm run build
```

---

## 7. Hướng dẫn vận hành & Triển khai

1. **Chạy Local Backend:**
   - Cấu hình `.env` (chọn `LLM_PROVIDER=openai_compatible` với Groq API key hoặc `ollama`).
   - Chạy migration: `python -m alembic upgrade head`.
   - Khởi động server: `uvicorn app.main:app --reload --port 8000`.
2. **Chạy Local Frontend:**
   - Chạy `npm run dev` trong thư mục `frontend/`. Mặc định gọi Backend thật tại `http://localhost:8000/api/v1`.
3. **Deploy Cloudflare Workers (Frontend):**
   - File cấu hình `frontend/wrangler.jsonc` đã được khóa chuẩn SPA:
     ```jsonc
     {
       "$schema": "node_modules/wrangler/config-schema.json",
       "name": "nene",
       "compatibility_date": "2026-11-15",
       "assets": {
         "directory": "./dist",
         "not_found_handling": "single-page-application"
       }
     }
     ```
   - Chạy lệnh deploy: `npx wrangler deploy`.
4. **Deploy Render (Backend):**
   - Đảm bảo biến môi trường `OPENAI_API_KEY`, `OPENAI_BASE_URL` và `CORS_ORIGINS` được thiết lập trên Render Dashboard. Backend đã tích hợp sẵn domain Cloudflare Workers và wildcard subdomain trong cấu hình CORS mặc định.
