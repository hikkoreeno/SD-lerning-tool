import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        const { folderPath, files } = await req.json();

        if (!folderPath || !files || !Array.isArray(files)) {
            return NextResponse.json(
                { error: "folderPath and an array of files are required." },
                { status: 400 }
            );
        }

        // Ensure the directory exists
        if (!fs.existsSync(folderPath)) { // Corrected: removed extra ')'
            return NextResponse.json(
                { error: "Specified folder path does not exist." },
                { status: 400 }
            );
        }

        const savedFiles = [];

        for (const file of files) {
            const { fileName, content, isBinary } = file;
            if (!fileName || !content) continue;

            const fullPath = path.join(folderPath, fileName);

            if (isBinary) {
                // If it's a data URL (e.g. data:image/png;base64,...)
                const base64Data = content.split(",")[1] || content;
                const buffer = Buffer.from(base64Data, "base64");
                fs.writeFileSync(fullPath, buffer);
            } else {
                fs.writeFileSync(fullPath, content, "utf8");
            }
            savedFiles.push(fullPath);
        }

        return NextResponse.json({ success: true, savedFiles });
    } catch (error: any) {
        console.error("Save error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to save file(s)." },
            { status: 500 }
        );
    }
}
