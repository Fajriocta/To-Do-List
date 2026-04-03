# To-Do List

Aplikasi to-do list berbasis web dengan fitur mood tracker dan insights produktivitas. Menggunakan HTML, CSS, dan JavaScript, tanpa framework dan dependensi.

[**Demo**](https://todolistcihuyy.netlify.app/)

---

## Fitur

### Mood Tracker
- Pilih mood harian dari 5 pilihan: 😄 😊 😐 😔 😤
- Mengubah tema warna aplikasi secara dinamis sesuai mood yang dipilih
- Quote motivasi menyesuaikan mood yang dipilih
- Riwayat mood 7 hari terakhir ditampilkan secara visual

### Manajemen Tugas
- Tambah tugas dengan nama, kategori, prioritas, dan deadline
- Edit tugas via modal popup
- Hapus tugas individual
- Tandai tugas selesai/belum dengan checkbox
- Setiap tugas menyimpan **mood saat dibuat** dan **mood saat diselesaikan**
- Badge visual: kategori, prioritas (Tinggi/Sedang/Rendah), deadline, dan mood

### Smart Sorting Berbasis Mood
- Mood bagus (😄/🙂) → tugas prioritas **tinggi** ditampilkan duluan
- Mood buruk (😔/😤) → tugas prioritas **rendah** ditampilkan duluan, sehigga tidak overwhelmed :^)

### Filter Tugas
- **Semua** —> tampilkan seluruh tugas
- **Belum** —> hanya tugas yang belum selesai
- **Selesai** —> hanya tugas yang sudah selesai

### Insights & Statistik
Panel collapsible yang berisi:
- Streak mood hari ini
- **Pie chart** progress tugas (hari ini atau semua)
- **Bar chart korelasi** mood vs jumlah tugas yang diselesaikan
- Info mood paling produktif berdasarkan histori

---

## Struktur Proyek

```
To-Do-List/
├── index.html   # Struktur UI
├── app.js       # Logika aplikasi & event handling
└── style.css    # Styling & animasi
```

---


## Cara Pakai Lokal

Cukup clone dan buka langsung di browser:

```bash
git clone https://github.com/fajrioctadiansyah/To-Do-List.git
cd To-Do-List
# Buka index.html di browser
```

---

## Data & Privasi

Semua data disimpan di **localStorage** browser kamu dan tidak ada server, tidak ada data yang dikirim ke mana pun. 
Gunakan tombol **Hapus Semua Data** di bagian bawah untuk menghapus seluruh data secara permanen.
