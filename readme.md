# 🎬 Content Pipeline & Management API (Backend)

Backend RESTful API untuk platform manajemen alur kerja (pipeline) pembuatan konten media sosial. Sistem ini dirancang menggunakan **Node.js**, **Express.js**, dan **MySQL** dengan arsitektur kontrol akses berbasis peran (*Role-Based Access Control / RBAC*).

---

## 👥 Hak Akses & Peran Pengguna (RBAC)

Aplikasi memiliki 3 role utama dengan batasan akses berikut:

1. **Admin**
   - **Akses Penuh**: Dapat melihat, membuat, memperbarui, dan menghapus seluruh data (Users, Channels, Contents, Checklists, Metrics).
   - Memiliki kendali penuh untuk menugaskan Editor ke konten mana pun.

2. **Creator**
   - **Manajemen Konten Mandiri**: Hanya dapat melihat, memperbarui, dan menghapus konten yang dibuat oleh dirinya sendiri (`user_id`).
   - **Channels**: Dapat membuat dan mengelola channel milik sendiri.
   - **Checklist & Metrics**: Bebas membuat checklist produksi dan mencatat statistik performa harian (`content_metrics`) untuk konten yang sudah dipublish.

3. **Editor**
   - **Terbatas pada Tugas**: Hanya dapat melihat konten yang ditugaskan (*assigned*) kepadanya (`editor_id`).
   - **Restriksi Form**: Dilarang mengubah data dasar (Judul, Channel, Naskah, Prioritas, Tanggal, dll).
   - **Akses Khusus Editing**: Hanya diizinkan memperbarui `editing_link` (link hasil edit/draft) dan `published_url`, serta mencentang (*toggle*) status item checklist produksi.

---

## 🛠️ Stack Teknologi

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL / MariaDB (Driver: `mysql2` dengan Promises)
- **Autentikasi**: JSON Web Token (JWT) & `bcryptjs`
- **Environment**: `dotenv`

---

## 🗄️ Skema Database & Tabel Utama

### 1. `users`
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR, Hashed)
- `role` (ENUM: `'admin'`, `'creator'`, `'editor'`)

### 2. `channels`
- `id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key ke `users.id`)
- `platform` (ENUM: `'youtube'`, `'instagram'`, `'tiktok'`, `'facebook'`)
- `handle_name` (VARCHAR)

### 3. `contents`
- `id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key ke `users.id` - Pembuat Konten)
- `editor_id` (INT, Foreign Key ke `users.id` - Editor yang ditugaskan, NULLable)
- `channel_id` (INT, Foreign Key ke `channels.id`)
- `title` (VARCHAR)
- `description` (TEXT)
- `script_draft` (TEXT)
- `editing_link` (VARCHAR 500 - Link Google Drive/Frame.io)
- `published_url` (VARCHAR 500 - Link hasil publish publik)
- `format_type` (ENUM: `'short_video'`, `'long_video'`, `'carousel'`, `'single_post'`)
- `priority` (ENUM: `'low'`, `'medium'`, `'high'`)
- `status` (ENUM: `'idea'`, `'scripting'`, `'recording'`, `'editing'`, `'review'`, `'ready'`, `'published'`)
- `scheduled_date` (DATE)
- `published_date` (DATE)

### 4. `content_checklists`
- `id` (INT, Primary Key, Auto Increment)
- `content_id` (INT, Foreign Key ke `contents.id`)
- `task_name` (VARCHAR 255)
- `is_completed` (TINYINT / BOOLEAN)

### 5. `content_metrics`
- `id` (INT, Primary Key, Auto Increment)
- `content_id` (INT, Foreign Key ke `contents.id`)
- `views_count` (INT)
- `likes_count` (INT)
- `comments_count` (INT)
- `shares_count` (INT)
- `recorded_at` (DATE)

---

## 📌 Dokumentasi Endpoint API

Semua endpoint privat memerlukan Header Autentikasi:  
`Authorization: Bearer <token_jwt>`

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Login pengguna & dapatkan Token JWT |
| `GET` | `/api/auth/me` | Private | Mengambil data profile user yang sedang login |

### 📺 Channels (`/api/channels`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/channels` | Private | Mengambil daftar channel |
| `POST` | `/api/channels` | Admin, Creator | Menambahkan channel publikasi baru |

### 📑 Contents / Pipeline (`/api/contents`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/contents` | Private | Ambil daftar konten (Filtered by Role) |
| `POST` | `/api/contents` | Admin, Creator | Membuat draft konten baru |
| `PUT` | `/api/contents/:id` | Private | Memperbarui detail konten / link editing |
| `DELETE` | `/api/contents/:id` | Admin, Creator | Menghapus konten |

### 📋 Checklists (`/api/checklists` / `/api/contents/:id/checklists`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/contents/:id/checklists` | Private | Ambil seluruh checklist dari suatu konten |
| `POST` | `/api/contents/:id/checklists` | Admin, Creator | Menambah item checklist baru |
| `PATCH` | `/api/checklists/:id/toggle` | All Roles | Mencentang / uncheck status checklist |
| `DELETE` | `/api/checklists/:id` | Admin, Creator | Menghapus item checklist |

### 📊 Performance Metrics (`/api/contents/:id/metrics`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/contents/:id/metrics` | Private | Ambil riwayat statistik performa konten |
| `POST` | `/api/contents/:id/metrics` | Admin, Creator | Catat performa statistik harian (Views, Likes, dll) |

---

## 🚀 Cara Menjalankan Server Backend

1. **Clone & Install Dependencies**
   ```bash
   npm install