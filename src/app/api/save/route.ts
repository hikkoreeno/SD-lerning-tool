import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        const { folderPath, fileName, content } = await req.json();

        if (!folderPath || !fileName || !content) {
            return NextResponse.json(
                { error: "folderPath, fileName, and content are required." },
                { status: 400 }
            );
        }

        // Ensure the directory exists
        if (!fs.existsSync(folderPath)) {
            return NextResponse.json(
                { error: "Specified folder path does not exist." },
                { status: 400 }
            );
        }

        const fullPath = path.join(folderPath, fileName);

        // Check for existing file to avoid accidental overwrite if desired, 
        // but for this tool, overwriting or versioning is a choice. 
        // Let's just write/overwrite for simplicity unless it's a critical safety concern.
        fs.writeFileSync(fullPath, content, "utf8");

        return NextResponse.json({ success: true, path: fullPath });
    } catch (error: any) {
        console.error("Save error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to save file." },
            { status: 500 }
        );
    }
}
