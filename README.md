# 🃏 FlashCard – Ứng dụng học từ vựng thông minh

## 🚀 Cách chạy

### Terminal 1 – Backend API
```bash
cd backend
npm install
node server.js
# → http://localhost:3001
```

### Terminal 2 – Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

## 🔑 Tính năng
- 🔐 Đăng ký / đăng nhập JWT
- 📚 Quản lý bộ từ (màu sắc, mô tả)
- ➕ Thêm/sửa/xóa từ (term, phonetic, loại từ, nghĩa, ví dụ)
- 🃏 Flashcard 3D flip animation
- 🔊 Phát âm TTS (Web Speech API – không cần API key)
- 🧠 Thuật toán Spaced Repetition SM-2 (giống Anki)
- ⌨️  Phím tắt: `Space` lật thẻ, `1/2/3` đánh giá
- 📊 Dashboard thống kê + streak học liên tiếp
- 🎯 Màn hình tổng kết phiên học

## 📁 Cấu trúc
```
flashcard-app/
├── backend/
│   ├── server.js          ← Express server (port 3001)
│   ├── db/setup.js        ← SQLite schema
│   ├── middleware/auth.js ← JWT middleware
│   └── routes/
│       ├── auth.js        ← /api/auth/*
│       ├── decks.js       ← /api/decks/*
│       ├── cards.js       ← /api/cards/*
│       └── progress.js    ← /api/progress/* (SM-2)
└── frontend/
    └── src/
        ├── pages/         ← Login, Register, Dashboard, DeckDetail, Study
        ├── components/    ← Flashcard3D, DeckCard, Navbar, StudySummary
        ├── store/         ← Zustand global state
        └── api/           ← Axios client
```
