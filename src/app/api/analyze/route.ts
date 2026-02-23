import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const systemPrompt = `
あなたはStable Diffusionプロンプト解析の最高峰の専門家です。
高い論理的推論力を駆使し、初心者にもわかりやすい言葉で以下のフォーマットに従って日本語で解説を出力してください。

【1. プロンプトの全体像】
このプロンプトが何を描こうとしているのか、情景を1〜2行でわかりやすく解説してください。

【2. 要素ごとの日本語訳と効果（初心者向け解説）】
プロンプトを要素に分解し、それぞれの英単語の「日本語の意味」と「画像生成においてどのような効果をもたらすか」を初心者にわかるように解説してください。

【3. 推論による精密分析（ウェイトと矛盾のチェック）】
・(word:1.5) のような重み付けの影響。
・タグ同士の競合やAIを混乱させる構造的欠陥がないかを深く思考し指摘。

【4. 実画像との答え合わせ（※画像がある場合のみ）】
添付画像を分析し、「意図したプロンプトが画像にどう反映されているか」「どのタグが無視されているか」を視覚的に照合。その上でウェイト調整やネガティブプロンプトの追加など実践的なデバッグ案を提示してください。
`;

export async function POST(req: Request) {
    try {
        const { prompt, image } = await req.json();

        const xai = new OpenAI({
            apiKey: process.env.XAI_API_KEY || "dummy_key",
            baseURL: "https://api.x.ai/v1",
        });

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const messages: any[] = [
            { role: "system", content: systemPrompt },
        ];

        if (image) {
            // Vision request
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: image, // Base64 image
                        },
                    },
                ],
            });
        } else {
            // Standard chat request
            messages.push({ role: "user", content: prompt });
        }

        const response = await xai.chat.completions.create({
            model: image ? "grok-2-vision-latest" : "grok-2-latest",
            messages,
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream);
    } catch (error: any) {
        console.error("Grok API Error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
