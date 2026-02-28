export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, question } = req.body;

    if (!image && !question) {
      return res.status(400).json({ error: "No input provided" });
    }

    // 🔑 GANTI DI SINI DENGAN API KEY BARU KAMU
    const GEMINI_API_KEY = "AIzaSyCKNCMCGAI-LSmU08oUDLp2rMoT4nl0Law";

    let response, data, result;

    if (image) {
      // ==============================
      // Analisa Gambar (image-bison-001)
      // ==============================
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/image-bison-001:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
Anda adalah ahli botani, ahli pertanian, dan dokter hewan profesional.

Jika gambar adalah tumbuhan → gunakan format analisa tumbuhan.
Jika gambar adalah hewan → gunakan format analisa hewan.
Jika bukan keduanya → jelaskan dengan jelas.

==============================
🌿 ANALISA TUMBUHAN
==============================

1️⃣ IDENTITAS DASAR
- Nama lokal:
- Nama ilmiah:
- Klasifikasi:
- Liar atau budidaya:
- Perkiraan usia:
- Habitat alami:

2️⃣ TUJUAN & FUNGSI
- Fungsi utama:
- Manfaat bagi manusia:
- Manfaat bagi hewan:
- Manfaat bagi lingkungan:
- Nilai ekonomi:

3️⃣ KONDISI FISIK & KESEHATAN
- Warna daun:
- Kondisi batang:
- Kondisi akar:
- Ada bercak:
- Ada busuk:
- Ada jamur:
- Ada hama:
- Kondisi tanah:
- Pertumbuhan:
- Tingkat kesehatan (0-100%):

4️⃣ ANALISIS PENYEBAB
- Kekurangan air:
- Kelebihan air:
- Kurang cahaya:
- Kekurangan nutrisi:
- Infeksi:
- Hama:
- Stres lingkungan:

5️⃣ SOLUSI & PERAWATAN
- Langkah perbaikan:
- Perlu pindah lokasi:
- Rekomendasi pupuk:
- Frekuensi penyiraman:
- Anti-hama:
- Estimasi pemulihan:

==============================
🐾 ANALISA HEWAN
==============================

1️⃣ IDENTITAS
- Jenis hewan:
- Nama umum:
- Perkiraan usia:
- Liar atau peliharaan:

2️⃣ KONDISI UMUM
- Aktivitas:
- Postur:
- Berat badan:
- Nafsu makan:
- Bulu/kulit:
- Mata:
- Kaki:

3️⃣ TANDA PENYAKIT
- Luka:
- Infeksi:
- Diare:
- Batuk:
- Bersin:
- Stres:

4️⃣ ANALISIS PENYEBAB
- Bakteri:
- Virus:
- Parasit:
- Kekurangan nutrisi:
- Lingkungan:

5️⃣ SARAN PERAWATAN
- Tindakan awal:
- Perlu dokter hewan:
- Vitamin:
- Perubahan makan:
- Tingkat kesehatan (0-100%):

Jawaban harus profesional, terstruktur, jelas, dan tidak bertele-tele.
`
                  },
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: image
                    }
                  }
                ]
              }
            ]
          })
        }
      );

      data = await response.json();

      if (data.error) {
        return res.status(400).json({
          error: "Gemini API error",
          detail: data.error.message
        });
      }

      result = data.candidates?.[0]?.content?.parts?.[0]?.text || "Analisis tidak tersedia.";
    } else if (question) {
      // ==============================
      // Text-only (text-bison-001)
      // ==============================
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/text-bison-001:generateText?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ content: question }],
            temperature: 0.2,
            candidateCount: 1,
            maxOutputTokens: 500
          })
        }
      );

      data = await response.json();

      if (data.error) {
        return res.status(400).json({
          error: "Gemini API error",
          detail: data.error.message
        });
      }

      result = data.candidates?.[0]?.content?.[0]?.text || "Jawaban tidak tersedia.";
    }

    return res.status(200).json({ result });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      detail: error.message
    });
  }
}
