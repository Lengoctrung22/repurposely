import { GoogleGenAI } from "@google/genai";
import { IContentModeration } from "@/models/RepurposeJob";

export interface ModerationInput {
  title: string;
  content: string;
  apiKey?: string;
}

// Bộ từ khóa quy tắc kiểm duyệt nội dung ngoại tuyến (Heuristic Rule Engine)
const VIOLATION_PATTERNS = {
  spamScam: [
    /cá cược/i,
    /cờ bạc/i,
    /lô đề/i,
    /soi cầu/i,
    /kubet/i,
    /thabet/i,
    /casino/i,
    /nạp rút tiền 1:1/i,
    /nhận tiền miễn phí ngay/i,
    /đầu tư sinh lời 100%/i,
    /kiếm tiền không cần làm/i,
    /đa cấp lừa đảo/i,
    /hack nick/i,
    /free crypto airdrop instant/i,
  ],
  dangerousContent: [
    /kích động bạo lực/i,
    /khủng bố/i,
    /chế tạo bom/i,
    /mua bán vũ khí/i,
    /hướng dẫn tự tử/i,
    /tự hại/i,
    /buôn bán ma túy/i,
    /chất cấm/i,
    /chém giết/i,
  ],
  sexuallyExplicit: [
    /khiêu dâm/i,
    /đồi trụy/i,
    /quan hệ tình dục/i,
    /clip 18\+/i,
    /loạn luân/i,
    /gái gọi/i,
    /bán dâm/i,
    /pornography/i,
    /explicit sex/i,
  ],
  hateSpeech: [
    /phân biệt chủng tộc/i,
    /kỳ thị tôn giáo/i,
    /kỳ thị vùng miền/i,
    /bọn mọi rợ/i,
    /tiêu diệt sắc tộc/i,
    /thù ghét dân tộc/i,
  ],
  harassment: [
    /lăng mạ/i,
    /sỉ nhục/i,
    /đe dọa giết/i,
    /bôi nhọ danh dự/i,
    /tấn công cá nhân/i,
  ],
};

/**
 * Phân tích kiểm duyệt tự động dựa trên quy tắc ngoại tuyến (Rule-based Fallback)
 */
function analyzeHeuristic(text: string): IContentModeration {
  const flags = {
    hateSpeech: false,
    harassment: false,
    sexuallyExplicit: false,
    dangerousContent: false,
    spamScam: false,
  };

  const detectedReasons: string[] = [];

  for (const pattern of VIOLATION_PATTERNS.spamScam) {
    if (pattern.test(text)) {
      flags.spamScam = true;
      detectedReasons.push("Phát hiện dấu hiệu cờ bạc, lừa đảo hoặc spam");
      break;
    }
  }

  for (const pattern of VIOLATION_PATTERNS.dangerousContent) {
    if (pattern.test(text)) {
      flags.dangerousContent = true;
      detectedReasons.push("Phát hiện nội dung có yếu tố nguy hiểm hoặc kích động bạo lực");
      break;
    }
  }

  for (const pattern of VIOLATION_PATTERNS.sexuallyExplicit) {
    if (pattern.test(text)) {
      flags.sexuallyExplicit = true;
      detectedReasons.push("Phát hiện nội dung khiêu dâm hoặc nhạy cảm 18+");
      break;
    }
  }

  for (const pattern of VIOLATION_PATTERNS.hateSpeech) {
    if (pattern.test(text)) {
      flags.hateSpeech = true;
      detectedReasons.push("Phát hiện ngôn từ thù ghét hoặc kỳ thị");
      break;
    }
  }

  for (const pattern of VIOLATION_PATTERNS.harassment) {
    if (pattern.test(text)) {
      flags.harassment = true;
      detectedReasons.push("Phát hiện hành vi xúc phạm hoặc quấy rối cá nhân");
      break;
    }
  }

  const violationCount = Object.values(flags).filter(Boolean).length;

  if (violationCount === 0) {
    return {
      status: "approved",
      safetyScore: 98,
      riskLevel: "low",
      flags,
      reason: "Nội dung chuẩn mực, không phát hiện vi phạm tiêu chuẩn cộng đồng.",
      analyzedAt: new Date(),
      autoModerated: true,
    };
  } else if (flags.dangerousContent || flags.sexuallyExplicit || violationCount >= 2) {
    return {
      status: "rejected",
      safetyScore: Math.max(15, 40 - violationCount * 10),
      riskLevel: "high",
      flags,
      reason: `Từ chối duyệt: ${detectedReasons.join("; ")}.`,
      analyzedAt: new Date(),
      autoModerated: true,
    };
  } else {
    return {
      status: "flagged",
      safetyScore: 65,
      riskLevel: "medium",
      flags,
      reason: `Cần lưu ý: ${detectedReasons.join("; ")}.`,
      analyzedAt: new Date(),
      autoModerated: true,
    };
  }
}

/**
 * Động cơ AI tự động phân tích và kiểm duyệt nội dung (Gemini 2.0 Flash + Heuristic Fallback)
 */
export async function analyzeContentSafety(input: ModerationInput): Promise<IContentModeration> {
  const combinedText = `${input.title}\n\n${input.content}`.trim();
  const apiKey = input.apiKey || process.env.GEMINI_API_KEY;

  // Nếu không có API Key hoặc key demo, chạy bộ quy tắc kiểm duyệt ngoại tuyến
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey.trim() === "") {
    return analyzeHeuristic(combinedText);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const prompt = `
Bạn là hệ thống AI Content Safety & Policy Moderator độc lập và bảo mật cao.
Nhiệm vụ: Phân tích kỹ nội dung bài viết dưới đây và đánh giá độ an toàn theo 5 tiêu chuẩn cộng đồng quốc tế:
1. hateSpeech: Ngôn từ thù ghét, kỳ thị tôn giáo, sắc tộc, quốc gia, giới tính.
2. harassment: Quấy rối, lăng mạ, đe dọa, xúc phạm danh dự cá nhân.
3. sexuallyExplicit: Nội dung đồi trụy, khiêu dâm, 18+, mại dâm.
4. dangerousContent: Kích động bạo lực, tự hại, tự tử, khủng bố, hướng dẫn chế tạo vũ khí, ma túy.
5. spamScam: Cờ bạc, cá cược, đa cấp lừa đảo, lừa đảo tài chính, phát tán mã độc, tin giả ác ý.

NỘI DUNG CẦN ĐÁNH GIÁ:
"""
${combinedText.slice(0, 15000)}
"""

QUY TẮC ĐÁNH GIÁ:
- safetyScore: từ 0 đến 100 (100 là an toàn tuyệt đối; 70-100: approved; 40-69: flagged; <40: rejected).
- riskLevel: "low" | "medium" | "high".
- status: "approved" (nếu an toàn) | "flagged" (nếu có yếu tố nhạy cảm cần cảnh báo) | "rejected" (nếu vi phạm nghiêm trọng).
- reason: Câu nhận xét súc tích bằng tiếng Việt (1-2 câu) giải thích tại sao an toàn hoặc chỉ rõ lỗi vi phạm.

HÃY TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ THEO CẤU TRÚC SAU (không bọc markdown, không thêm ký tự nào khác):
{
  "safetyScore": 95,
  "riskLevel": "low",
  "status": "approved",
  "flags": {
    "hateSpeech": false,
    "harassment": false,
    "sexuallyExplicit": false,
    "dangerousContent": false,
    "spamScam": false
  },
  "reason": "Nội dung chia sẻ kiến thức tích cực, an toàn tuyệt đối và phù hợp xuất bản."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const responseText = response.text?.trim() || "{}";
    const cleaned = responseText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    const safetyScore = typeof parsed.safetyScore === "number" ? parsed.safetyScore : 95;
    const status: "approved" | "flagged" | "rejected" =
      ["approved", "flagged", "rejected"].includes(parsed.status)
        ? parsed.status
        : safetyScore >= 70
        ? "approved"
        : safetyScore >= 40
        ? "flagged"
        : "rejected";

    const riskLevel: "low" | "medium" | "high" =
      ["low", "medium", "high"].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : status === "approved"
        ? "low"
        : status === "flagged"
        ? "medium"
        : "high";

    return {
      status,
      safetyScore,
      riskLevel,
      flags: {
        hateSpeech: Boolean(parsed.flags?.hateSpeech),
        harassment: Boolean(parsed.flags?.harassment),
        sexuallyExplicit: Boolean(parsed.flags?.sexuallyExplicit),
        dangerousContent: Boolean(parsed.flags?.dangerousContent),
        spamScam: Boolean(parsed.flags?.spamScam),
      },
      reason: parsed.reason || "Nội dung đã được AI quét và phê duyệt an toàn.",
      analyzedAt: new Date(),
      autoModerated: true,
    };
  } catch (error) {
    console.warn("Lỗi gọi Gemini Moderation, chuyển sang Heuristic Scanner:", error);
    return analyzeHeuristic(combinedText);
  }
}
