
import { GoogleGenAI } from "@google/genai";
import { PosterConfig } from "../types";

export class GeminiService {
  private static getAI() {
    // API KEY harus diambil dari process.env.API_KEY sesuai instruksi platform
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key tidak terdeteksi. Pastikan Anda sudah mengatur API Key di environment.");
    }
    return new GoogleGenAI({ apiKey });
  }

  static async generatePoster(
    base64Image: string, 
    config: PosterConfig,
    isHighQuality: boolean = false
  ): Promise<string> {
    const ai = this.getAI();
    // Gunakan model sesuai spesifikasi tugas
    const modelName = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    // Prompt dioptimalkan agar lebih instruktif bagi model image-to-image
    const prompt = `
      As a professional commercial graphic designer, transform this product photo into a high-end promotional poster.
      
      PRODUCT SPECIFICATIONS:
      - Name: "${config.productName}"
      - Price: "${config.price}"
      - Marketing Details: "${config.details}"
      
      DESIGN RULES:
      1. Keep the original product shape and details intact. Do not distort the product.
      2. Enhance the lighting to professional studio quality.
      3. Create a premium background that complements the product category.
      4. Add clean, modern typography for the title and price.
      5. The final output must be a single cohesive advertisement image.
      6. Required Aspect Ratio: ${config.ratio}.
    `;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1],
                mimeType: 'image/png',
              },
            },
            { text: prompt },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: config.ratio as any,
            // imageSize hanya berlaku untuk gemini-3-pro-image-preview
            ...(modelName === 'gemini-3-pro-image-preview' ? { imageSize: config.quality } : {})
          }
        }
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("AI tidak memberikan respon. Coba gunakan gambar produk yang lebih jelas.");
      }

      const candidate = response.candidates[0];

      // PENTING: Cek apakah diblokir oleh Safety Filter (Sering jadi penyebab gagal)
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("Konten diblokir oleh filter keamanan AI. Coba ubah deskripsi produk atau gunakan gambar lain.");
      }

      let imageUrl = '';
      // Iterasi parts untuk mencari inlineData (gambar)
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error("AI membalas dengan teks tetapi gagal merender gambar. Coba kurangi detail deskripsi.");
      }

      return imageUrl;
    } catch (error: any) {
      console.error("Gemini Service Error Detail:", error);
      // Teruskan pesan error spesifik agar bisa ditampilkan di UI
      throw error;
    }
  }
}
