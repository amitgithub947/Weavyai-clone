import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const extractFrameRequestSchema = z.object({
  nodeId: z.string(),
  videoUrl: z.string(),
  timestamp: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = extractFrameRequestSchema.parse(body);

    // TODO: Call Trigger.dev task for FFmpeg frame extraction
    // For now, return a mock response
    return NextResponse.json({
      outputUrl: "", // Mock: return empty URL
      nodeId: validated.nodeId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", issues: error.issues },
        { status: 400 }
      );
    }
    
    console.error("❌ Error extracting frame:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
