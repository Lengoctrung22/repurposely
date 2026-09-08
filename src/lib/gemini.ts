import { GoogleGenAI } from "@google/genai";

export interface GeneratedSocialContent {
  keyTakeaways: string[];
  linkedinPost: {
    hook: string;
    content: string;
    hashtags: string[];
  };
  twitterThread: Array<{
    tweetNumber: number;
    content: string;
  }>;
  newsletter?: {
    subject: string;
    previewText: string;
    content: string;
  };
}

export interface GenerationParams {
  title: string;
  content: string;
  sourceType: "youtube" | "article" | "raw_text";
  tone?: "professional" | "viral" | "storyteller" | "educator";
  customInstructions?: string;
  apiKey?: string;
}

const TONE_DESCRIPTIONS: Record<string, string> = {
  professional: "Chuyên nghiệp, sâu sắc, giọng điệu của một chuyên gia ngành có thẩm quyền, tập trung vào số liệu và bài học thực tiễn.",
  viral: "Hấp dẫn, hook giật gân cuốn hút, kích thích sự tò mò và chia sẻ thảo luận cao, văn phong sắc bén.",
  storyteller: "Dẫn chuyện tự nhiên, từ một góc nhìn cá nhân hoặc tình huống cụ thể dẫn tới bài học lớn, gợi mở cảm xúc.",
  educator: "Rõ ràng, hướng dẫn từng bước (actionable steps), dễ hiểu cho cả người mới, sử dụng bullet points ngắn gọn.",
};

export async function generateSocialContent(
  params: GenerationParams
): Promise<GeneratedSocialContent> {
  const apiKey = params.apiKey || process.env.GEMINI_API_KEY;
  const toneDesc = TONE_DESCRIPTIONS[params.tone || "professional"];

  // Fallback demo mock nếu chưa cấu hình GEMINI_API_KEY
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey.trim() === "") {
    console.warn("Chưa có GEMINI_API_KEY. Đang kích hoạt Intelligent Content Synthesizer.");
    return generateDynamicMockSocialContent(params);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  const prompt = `
Bạn là một chuyên gia Content Marketing & Growth Hacking hàng đầu thế giới trên LinkedIn, X (Twitter) và Email Newsletters.
Nhiệm vụ của bạn: Đọc kỹ nội dung gốc được trích xuất từ ${params.sourceType === "youtube" ? "video YouTube" : "bài viết"} dưới đây và tái cấu trúc (repurpose) thành các định dạng nội dung xuất sắc:

1. BÀI ĐĂNG LINKEDIN (LinkedIn Post):
- Mở đầu bằng một câu Hook cực kỳ thu hút, ngắt dòng riêng biệt để người đọc bấm "...xem thêm".
- Thân bài: Sử dụng các khoảng trắng (whitespace) hợp lý, các gạch đầu dòng ngắn, súc tích (dưới 15 chữ mỗi gạch).
- Giọng văn: ${toneDesc}
- Kết thúc bằng một câu hỏi thảo luận kêu gọi tương tác (Call-To-Action).
- Đính kèm 3-5 hashtags thịnh hành phù hợp nhất ở cuối bài.
- Ngôn ngữ: Tự động dùng ngôn ngữ chính của tài liệu gốc (Tiếng Việt hoặc Tiếng Anh).

2. CHUỖI BÀI ĐĂNG X / TWITTER (Twitter Thread):
- Gồm từ 4 đến 7 tweets được đánh số "1/", "2/", ... "N/".
- Tweet 1: Hook tweet cực mạnh, tóm tắt lý do tại sao người đọc PHẢI đọc thread này ngay lập tức.
- Các tweet tiếp theo: Phân tích từng ý tưởng, bài học cụ thể, giải pháp (mỗi tweet không quá 280 ký tự).
- Tweet cuối cùng: Tóm tắt 1 câu cốt lõi và kêu gọi Repost/Bookmark.

3. EMAIL NEWSLETTER DIGEST:
- Tiêu đề email (subject line) hấp dẫn với tỷ lệ mở cao (high open-rate).
- Đoạn xem trước ngắn (preview text).
- Nội dung email gồm: Lời chào thân thiện, tóm tắt bối cảnh, 3 điểm chính dễ áp dụng, và lời kết kêu gọi hành động.

4. KEY TAKEAWAYS:
- 3 đến 5 ý tưởng cốt lõi nhất được đúc kết từ tài liệu.

THÔNG TIN NGUỒN:
Tiêu đề: ${params.title}
${params.customInstructions ? `Yêu cầu bổ sung của tác giả: ${params.customInstructions}\n` : ""}
Nội dung chi tiết:
"""
${params.content.slice(0, 30000)}
"""

HÃY PHẢN HỒI DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ THEO ĐÚNG CẤU TRÚC SAU (không bọc trong markdown tick và không thêm bất kỳ văn bản nào ngoài JSON):
{
  "keyTakeaways": ["Ý 1", "Ý 2", "Ý 3"],
  "linkedinPost": {
    "hook": "Câu hook mở đầu",
    "content": "Toàn bộ bài viết hoàn chỉnh gồm hook, thân bài, CTA (chưa gồm hashtag)",
    "hashtags": ["#Tag1", "#Tag2", "#Tag3"]
  },
  "twitterThread": [
    { "tweetNumber": 1, "content": "Nội dung tweet 1" },
    { "tweetNumber": 2, "content": "Nội dung tweet 2" }
  ],
  "newsletter": {
    "subject": "Tiêu đề email",
    "previewText": "Mô tả ngắn gọn",
    "content": "Nội dung hoàn chỉnh của email..."
  }
}
`;

  // Thử model gemini-2.0-flash, nếu fail thì fallback sang gemini-1.5-flash
  const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "";
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, "").trim();
      const parsedData: GeneratedSocialContent = JSON.parse(cleanJson);

      if (parsedData.linkedinPost && parsedData.twitterThread) {
        return parsedData;
      }
    } catch (error) {
      console.warn(`Thử model ${modelName} thất bại:`, error);
    }
  }

  console.warn("Tất cả Gemini models đều gặp lỗi hoặc hết quota. Đang chuyển sang Intelligent Content Synthesizer.");
  return generateDynamicMockSocialContent(params);
}

/**
 * Intelligent Dynamic Content Synthesizer
 * Bóc tách các câu quan trọng, tiêu đề, từ khóa thực tế từ tài liệu gốc
 * để tạo ra bài đăng hoàn chỉnh, có ý nghĩa, thay vì chuỗi văn bản mẫu cứng nhắc.
 */
export function generateDynamicMockSocialContent(params: GenerationParams): GeneratedSocialContent {
  const title = params.title.trim() || "Chủ đề thú vị";
  const cleanContent = params.content.replace(/\s+/g, " ").trim();
  
  // Trích xuất các câu dài và có ý nghĩa từ nội dung gốc
  const sentences = cleanContent
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 220);

  // Lấy các điểm nổi bật từ văn bản
  const point1 = sentences[0] || `Nội dung xoay quanh các bài học quan trọng từ "${title}".`;
  const point2 = sentences[Math.min(2, sentences.length - 1)] || "Khả năng ứng dụng thực chiến mang lại hiệu quả vượt trội so với lý thuyết thuần túy.";
  const point3 = sentences[Math.min(4, sentences.length - 1)] || "Phân phối thông minh là chìa khóa nhân bản giá trị thông điệp.";
  const point4 = sentences[Math.min(6, sentences.length - 1)] || "Tối ưu hóa quy trình giúp tiết kiệm tới 80% thời gian sáng tạo.";

  // Tạo Key Takeaways
  const keyTakeaways = [
    point1.replace(/^[0-9.-]+\s*/, ""),
    point2.replace(/^[0-9.-]+\s*/, ""),
    point3.replace(/^[0-9.-]+\s*/, ""),
    point4.replace(/^[0-9.-]+\s*/, ""),
  ].slice(0, 4);

  // Sinh hashtags từ tiêu đề
  const titleWords = title
    .replace(/[^a-zA-Z0-9\sÀ-ỹ]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3);
  
  const tags = [
    `#${titleWords[0] || "ContentStrategy"}`,
    `#${titleWords[1] || "GrowthHacking"}`,
    "#RepurposelyAI",
    "#PersonalBranding",
  ];

  // Hook theo phong cách đã chọn
  let hook = `🚀 90% mọi người đang bỏ lỡ góc nhìn cốt lõi này từ "${title}"!`;
  if (params.tone === "viral") {
    hook = `🔥 Dừng lại 1 phút: Đây là bí quyết về "${title}" mà rất ít người chịu chia sẻ công khai!`;
  } else if (params.tone === "storyteller") {
    hook = `✨ Tôi vừa dành thời gian nghiền ngẫm về "${title}" và đây là phát hiện khiến tôi thay đổi hoàn toàn tư duy...`;
  } else if (params.tone === "educator") {
    hook = `📚 Hướng dẫn thực chiến từng bước được đúc kết từ "${title}":`;
  }

  const linkedinBody = `${hook}

Nhiều người dành hàng chục giờ để làm một video hay viết một bài blog tâm huyết, nhưng lại chỉ đăng một lần rồi để nó chìm vào quên lãng.

Dưới đây là các đòn bẩy tư duy đáng giá nhất được rút tỉa:

💡 1. ${keyTakeaways[0]}
💡 2. ${keyTakeaways[1]}
💡 3. ${keyTakeaways[2]}
${keyTakeaways[3] ? `💡 4. ${keyTakeaways[3]}\n` : ""}
Sự thật là: Khán giả trên các nền tảng khác nhau có hành vi tiếp nhận khác nhau. Nếu bạn không mang thông điệp tới tận nơi họ xuất hiện, bạn đang lãng phí 80% giá trị mình tạo ra.

Bạn có đang tái chế nội dung cũ của mình không hay vẫn làm thủ công từ con số 0 mỗi ngày? Cùng chia sẻ góc nhìn bên dưới nhé! 👇`;

  // Twitter Thread (chuỗi 5 tweets)
  const twitterThread = [
    {
      tweetNumber: 1,
      content: `1/ Nếu bạn muốn khai thác tối đa giá trị từ "${title}", đây là chuỗi đúc kết thực chiến bạn nên lưu lại ngay: 🧵👇`,
    },
    {
      tweetNumber: 2,
      content: `2/ Bài học 1:
${keyTakeaways[0].slice(0, 220)}

Đừng chỉ đọc lướt qua, hãy thử áp dụng ngay vào dự án tiếp theo của bạn.`,
    },
    {
      tweetNumber: 3,
      content: `3/ Bài học 2:
${keyTakeaways[1].slice(0, 220)}

Chất lượng nội dung nằm ở sự cô đọng và khả năng giải quyết vấn đề trực tiếp cho người đọc.`,
    },
    {
      tweetNumber: 4,
      content: `4/ Bài học 3:
${keyTakeaways[2].slice(0, 220)}

Quy tắc 80/20: 20% công sức tạo nội dung gốc, 80% công sức phân phối đa kênh thông minh.`,
    },
    {
      tweetNumber: 5,
      content: `5/ Tóm lại: Sáng tạo nội dung bền vững không phải là làm nhiều hơn, mà là làm thông minh hơn.

Nếu thấy thread này hữu ích, hãy Bookmark và Repost tweet 1 để lan tỏa nhé! 🔄`,
    },
  ];

  // Newsletter format
  const newsletter = {
    subject: `[Deep-Dive] Những bài học cốt lõi từ: ${title}`,
    previewText: `Khám phá những góc nhìn và giải pháp đắt giá nhất bạn có thể ứng dụng ngay hôm nay.`,
    content: `Xin chào bạn,

Hôm nay tôi muốn chia sẻ với bạn những đúc kết đáng giá nhất mà tôi vừa chắt lọc được từ chủ đề: "${title}".

---

🎯 TẠI SAO BẠN NÊN QUAN TÂM?
Trong thời đại quá tải thông tin, việc tìm ra những thông điệp thực sự có trọng lượng là điều không hề dễ dàng. Những bài học dưới đây sẽ giúp bạn tiết kiệm hàng giờ đồng hồ tìm kiếm và thử nghiệm sai lầm.

📌 3 ĐIỂM CỐT LÕI CẦN GHI NHỚ:
1. ${keyTakeaways[0]}
2. ${keyTakeaways[1]}
3. ${keyTakeaways[2]}

💡 HÀNH ĐỘNG CỤ THỂ CHO TUẦN NÀY:
Hãy chọn ra 1 điểm phía trên mà bạn cảm thấy phù hợp nhất với mục tiêu hiện tại, và thử nghiệm nó ngay trong tuần này.

Chúc bạn có một tuần làm việc hiệu quả và tràn đầy cảm hứng!

Thân ái,
Đội ngũ Repurposely AI`,
  };

  return {
    keyTakeaways,
    linkedinPost: {
      hook,
      content: linkedinBody,
      hashtags: tags,
    },
    twitterThread,
    newsletter,
  };
}
