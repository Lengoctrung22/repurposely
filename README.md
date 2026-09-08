# 🚀 Repurposely AI — SaaS Content Repurposing Engine

**Repurposely AI** là một nền tảng SaaS hoàn chỉnh giúp các nhà sáng tạo nội dung, marketer và lập trình viên tự động biến đổi (repurpose) một video YouTube hoặc một bài viết blog/website thành chuỗi bài đăng chất lượng cao tối ưu cho **LinkedIn**, **Twitter / X Thread** và **Email Newsletter Digest** bằng mô hình **Google Gemini 2.0 Flash / 1.5 Flash**.

---

## 🌟 Tính Năng Nổi Bật

- 🎬 **YouTube Ingestion Engine**: Tự động bóc tách transcript và phụ đề của video YouTube (hỗ trợ cả tiếng Việt và tiếng Anh) kèm cơ chế tự động trích xuất metadata và mô tả khi video chưa bật CC.
- 🌐 **Web Article Scraper**: Tự động crawl và loại bỏ quảng cáo, navbar, footer để trích xuất nội dung bài viết sạch sẽ.
- 💡 **Key Takeaways Extractor**: Trích xuất 3–5 bài học/ý tưởng cốt lõi từ tài liệu gốc.
- 💼 **LinkedIn Post Generator**: Sinh bài đăng chuẩn phong cách LinkedIn (Hook bắt mắt, cấu trúc khoảng trắng dễ đọc trên di động, bullet points, CTA và hashtags). Hỗ trợ mô phỏng nút "...xem thêm" và đếm ký tự.
- 🧵 **Twitter / X Thread Generator**: Sinh chuỗi tweet `1/N` hấp dẫn, kiểm soát giới hạn 280 ký tự kèm thanh cảnh báo, hỗ trợ thêm hoặc xóa tweet tự động đánh số lại.
- 📬 **Email Newsletter Digest**: Sinh bản tin email chuyên nghiệp gồm Tiêu đề mở cao (Subject Line), đoạn xem trước (Preview Snippet) và nội dung định dạng tương thích Substack, Beehiiv, Mailchimp.
- 🎨 **Live Social Media Mockups**: Xem trước bài đăng trên giao diện mô phỏng chân thực của LinkedIn, X và Email.
- ✏️ **In-Place Editor & 1-Click Copy**: Cho phép chỉnh sửa trực tiếp trên giao diện xem trước, sao chép toàn bộ hoặc từng phần, và tải về file `.txt` / `.md`.
- 🍃 **MongoDB & Compass Ready**: Lưu trữ toàn bộ lịch sử bài viết vào MongoDB, dễ dàng quản lý và quan sát dữ liệu bằng **MongoDB Compass** (`repurposely.repurposejobs`).
- 🔄 **Nạp Lại Bài Cũ (Load into Editor)**: Cho phép mở bất kỳ bài viết nào từ Dashboard quay lại trình tạo trang chủ (`/?jobId=...`) để tiếp tục chỉnh sửa.
- 🔑 **Cấu Hình API Key Trực Tiếp Trong Trình Duyệt**: Hỗ trợ modal nhập và kiểm tra kết nối Gemini API Key ngay trên giao diện (lưu trong `localStorage`), kèm cơ chế **Intelligent Dynamic Synthesizer** chạy ngoại tuyến khi chưa có API key.
- 🌗 **Dark / Light Mode**: Hỗ trợ chuyển đổi giao diện sáng/tối mượt mà và ghi nhớ thiết lập.
- 🔐 **Hệ thống xác thực toàn diện**: Hỗ trợ đăng ký tài khoản mới (`/register`) và đăng nhập bằng Email & Mật khẩu được mã hóa bcryptjs trong MongoDB, bên cạnh Google OAuth và chế độ 1-Click Instant Demo.
- 🛡️ **Bảng Điều Khiển Quản Trị & Kiểm Duyệt Toàn Diện (`/admin`)**:
  - **Thống kê & Phân tích (Analytics)**: 4 thẻ KPI động, biểu đồ tỷ lệ phân bổ nguồn nội dung (YouTube vs Blog/Article), luồng hoạt động người dùng & bài viết gần đây.
  - **Quản lý người dùng (User Management)**: Tìm kiếm, lọc theo vai trò/trạng thái, phân quyền Admin/User, khóa/mở khóa tài khoản (Ban/Unban) và xóa tài khoản.
  - **Kiểm duyệt nội dung (Content Moderation)**: Duyệt toàn bộ bài viết trên hệ thống, modal xem trước chi tiết (Takeaways, LinkedIn, Twitter, Newsletter), xóa bài vi phạm và xuất báo cáo CSV (`/api/admin/jobs?format=csv`).
  - **Dev Mode Quick Switcher**: Nút chuyển đổi nhanh quyền Admin/User ngay trên thanh thông báo để phục vụ kiểm thử và trải nghiệm tức thì.

---

## 🛠️ Ngăn Xếp Công Nghệ (Tech Stack)

- **Framework**: [Next.js 16 (App Router, Turbopack, TypeScript)](https://nextjs.org/)
- **Styling**: Tailwind CSS + Lucide React Icons
- **Cơ sở dữ liệu**: [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **Xác thực**: [NextAuth.js (Auth.js v5)](https://authjs.dev/)
- **Mô hình AI**: [Google Gemini 2.0 Flash](https://ai.google.dev/) qua `@google/genai`
- **Trích xuất dữ liệu**: `youtube-transcript`, `cheerio`

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu hệ thống
- Đã cài đặt **Node.js 20+**
- Đã cài đặt và mở **MongoDB** hoặc **MongoDB Compass** trên máy tính (hoặc chuỗi kết nối MongoDB Atlas).

### 2. Cài đặt các thư viện phụ thuộc
```bash
npm install --legacy-peer-deps
```

### 3. Cấu hình biến môi trường
Tạo file `.env.local` từ file mẫu `.env.example`:
```env
MONGODB_URI="mongodb://localhost:27017/repurposely"
AUTH_SECRET="repurposely-ai-super-secret-key-min-32-chars-length"

# (Tùy chọn) Nhập Gemini API Key nếu muốn gọi AI trực tiếp thay vì mock demo
GEMINI_API_KEY="your_gemini_api_key_here"

# (Tùy chọn) Cấu hình Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```
*(Lưu ý: Bạn cũng có thể bấm vào biểu tượng chìa khóa 🔑 trên thanh điều hướng để nhập trực tiếp Gemini API Key của mình mà không cần sửa file `.env.local`).*

### 4. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Hoặc build và khởi chạy bản tối ưu production:
```bash
npm run build
npm run start
```
Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000).

---

## 🍃 Hướng Dẫn Kết Nối & Kiểm Tra Trên MongoDB Compass

1. Mở ứng dụng **MongoDB Compass** trên máy của bạn.
2. Nhập chuỗi kết nối mặc định: `mongodb://localhost:27017` và bấm **Connect**.
3. Bạn sẽ thấy database có tên: `repurposely`.
4. Mở collection: `repurposejobs` để xem danh sách toàn bộ các bài viết được lưu trữ gồm:
   - `sourceTitle`: Tiêu đề bài viết hoặc video
   - `sourceType`: youtube, article hoặc raw_text
   - `linkedinPost`: Nội dung bài đăng và hashtags
   - `twitterThread`: Mảng các tweet kèm số thứ tự
   - `newsletter`: Tiêu đề thư, đoạn xem trước và nội dung email
   - `keyTakeaways`: Các ý tưởng cốt lõi
   - `createdAt`: Thời gian tạo bản ghi

---

## 📁 Cấu Trúc Dự Án

```
src/
├── app/
│   ├── api/
│   │   ├── admin/stats/route.ts         # API thống kê tổng quan (KPIs, phân bổ nguồn, hoạt động gần đây)
│   │   ├── admin/users/route.ts         # API quản lý user (tìm kiếm, đổi vai trò, khóa, xóa)
│   │   ├── admin/jobs/route.ts          # API kiểm duyệt bài viết & xuất file CSV
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth endpoints
│   │   ├── auth/register/route.ts       # API đăng ký tài khoản Email & Mật khẩu
│   │   ├── auth/login/route.ts          # API đăng nhập tài khoản Email & Mật khẩu
│   │   ├── extract/route.ts             # API trích xuất YouTube & Blog
│   │   ├── generate/route.ts            # API sinh bài viết AI & lưu MongoDB
│   │   └── jobs/                        # API danh sách và chi tiết bài viết
│   ├── admin/page.tsx                   # Bảng điều khiển quản trị viên (Analytics, Users, Moderation)
│   ├── dashboard/page.tsx               # Bảng điều khiển cá nhân, bộ lọc, xuất file & modal chi tiết
│   ├── login/page.tsx                   # Trang đăng nhập Email/Password & Google
│   ├── register/page.tsx                # Trang đăng ký tài khoản mới
│   ├── layout.tsx                       # Root Layout & Theme Provider
│   └── page.tsx                         # Trang chủ ứng dụng & Live Previews
├── components/
│   ├── navbar.tsx                       # Header thanh điều hướng, theme toggle & API key modal trigger
│   ├── url-input-form.tsx               # Form nhập liệu, bóc tách & tùy chọn giọng điệu
│   ├── key-takeaways.tsx                # Khối tóm tắt bài học AI
│   ├── settings-modal.tsx               # Modal quản lý và kiểm tra Gemini API Key
│   └── social-preview/                  # Mockups LinkedIn, Twitter Thread & Newsletter
├── lib/
│   ├── db.ts                            # Mongoose connection singleton
│   ├── gemini.ts                        # Gemini AI generation & Dynamic Synthesizer
│   ├── utils.ts                         # Helper functions
│   └── extractors/                      # YouTube & Web scrapers
└── models/                              # Mongoose schemas (User, RepurposeJob)
```
