
import { GoogleGenAI } from "@google/genai";
import { PosterConfig } from "../types";

export class GeminiService {
  static async generatePoster(
    base64Image: string, 
    config: PosterConfig,
    isHighQuality: boolean = false
  ): Promise<string> {
    // Selalu buat instance baru tepat sebelum pemanggilan untuk memastikan API Key terbaru digunakan
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Pilih model berdasarkan kebutuhan kualitas
    const modelName = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const prompt = `
      As a professional commercial graphic designer, transform this product photo into a high-end promotional poster.
      
      PRODUCT SPECIFICATIONS:
      - Name: "${config.productName}"
      - Price: "${config.price}"
      - Marketing Details: "${config.details}"
      
      DESIGN RULES:
      1. Keep the original product shape and details intact.
      2. Enhance the lighting to professional studio quality.
      3. Create a premium background that complements the product category.
      4. Add clean, modern typography for the title and price.
      5. Required Aspect Ratio: ${config.ratio}.
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
            ...(modelName === 'gemini-3-pro-image-preview' ? { imageSize: config.quality } : {})
          }
        }
      });

      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("AI tidak memberikan respons. Coba gambar lain.");
      }

      const candidate = response.candidates[0];

      if (candidate.finishReason === 'SAFETY') {
        throw new Error("Konten diblokir oleh filter keamanan AI.");
      }

      let imageUrl = '';
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error("AI gagal menghasilkan gambar. Coba kurangi detail deskripsi.");
      }

      return imageUrl;
    } catch (error: any) {
      console.error("Gemini Service Error:", error);
      throw error;
    }
  }
}
