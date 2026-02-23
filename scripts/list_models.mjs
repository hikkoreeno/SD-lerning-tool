import OpenAI from "openai";

async function listModels() {
    const xai = new OpenAI({
        apiKey: process.env.XAI_API_KEY,
        baseURL: "https://api.x.ai/v1",
    });

    try {
        const models = await xai.models.list();
        console.log(JSON.stringify(models, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
