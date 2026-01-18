import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const llmRequestSchema = z.object({
  nodeId: z.string(),
  model: z.string(),
  systemPrompt: z.string().optional(),
  userMessage: z.string(),
  images: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let validated: z.infer<typeof llmRequestSchema> | null = null;
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    validated = llmRequestSchema.parse(body);

    // Check if Gemini API key is configured
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Gemini API key not configured. Please set GOOGLE_GEMINI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: validated.model });

    // Prepare content parts
    const parts: Part[] = [];

    // Add text content
    let textContent = validated.userMessage;
    if (validated.systemPrompt) {
      textContent = `${validated.systemPrompt}\n\n${textContent}`;
    }
    parts.push({ text: textContent });

    // Add images if provided
    if (validated.images && validated.images.length > 0) {
      for (const imageUrl of validated.images) {
        // Skip if imageUrl is empty or not a valid image
        if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
          console.warn("Skipping empty or invalid image URL");
          continue;
        }

        // Skip if it looks like text (not a data URL or HTTP URL)
        if (!imageUrl.startsWith("data:") && !imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
          // Check if it's valid base64 (should be long and contain base64 characters)
          const base64Pattern = /^[A-Za-z0-9+/=]+$/;
          if (!base64Pattern.test(imageUrl) || imageUrl.length < 100) {
            console.warn("Skipping invalid image data (looks like text):", imageUrl.substring(0, 50));
            continue;
          }
        }

        let imageData: string;
        let mimeType = "image/jpeg"; // Default MIME type

        if (imageUrl.startsWith("data:")) {
          // Extract base64 and MIME type from data URL
          const dataUrlMatch = imageUrl.match(/data:([^;]+);base64,(.+)/);
          if (dataUrlMatch) {
            mimeType = dataUrlMatch[1] || "image/jpeg";
            imageData = dataUrlMatch[2];
            
            // Validate that imageData is valid base64
            if (!imageData || imageData.trim() === "") {
              console.error("Empty base64 data in data URL");
              continue;
            }
          } else {
            // Fallback: try to extract just base64
            const base64Match = imageUrl.match(/base64,(.+)/);
            if (base64Match && base64Match[1]) {
              imageData = base64Match[1];
            } else {
              console.error("Invalid data URL format:", imageUrl.substring(0, 100));
              continue;
            }
          }
        } else if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
          // Fetch image from URL and convert to base64
          try {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
              console.error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
              continue;
            }
            
            const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
            mimeType = contentType;
            
            const arrayBuffer = await imageResponse.arrayBuffer();
            if (arrayBuffer.byteLength === 0) {
              console.error("Empty image response");
              continue;
            }
            
            const buffer = Buffer.from(arrayBuffer);
            imageData = buffer.toString("base64");
          } catch (error) {
            console.error("Error fetching image:", error);
            // Skip this image if fetch fails
            continue;
          }
        } else {
          // Assume it's already base64 - validate it
          const base64Pattern = /^[A-Za-z0-9+/=]+$/;
          if (!base64Pattern.test(imageUrl) || imageUrl.length < 100) {
            console.error("Invalid base64 image data");
            continue;
          }
          imageData = imageUrl;
        }

        // Validate that imageData is not empty and is valid base64
        if (!imageData || imageData.trim() === "") {
          console.error("Empty image data after processing");
          continue;
        }

        // Validate MIME type (Gemini supports: image/jpeg, image/png, image/webp, image/gif)
        const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
        if (!supportedTypes.includes(mimeType.toLowerCase())) {
          console.warn(`Unsupported image MIME type: ${mimeType}, defaulting to image/jpeg`);
          mimeType = "image/jpeg";
        }

        // Final validation: ensure imageData is valid base64
        try {
          // Try to decode a small portion to validate
          Buffer.from(imageData.substring(0, Math.min(100, imageData.length)), "base64");
        } catch {
          console.error("Invalid base64 data, skipping image");
          continue;
        }

        parts.push({
          inlineData: {
            data: imageData,
            mimeType: mimeType.toLowerCase(),
          },
        });
      }
    }


    // Generate content with retry logic for rate limits and service unavailable
    let output: string | undefined;
    let lastError: Error | null = null;
    const maxRetries = 3;
    const retryDelays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = retryDelays[attempt - 1] || 4000;
          console.log(`🔄 Retrying LLM request (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log(`🚀 Sending LLM request (attempt ${attempt + 1}/${maxRetries + 1})...`);
        const result = await model.generateContent({
          contents: [{ role: "user", parts }],
        });

        const response = await result.response;
        output = response.text();
        console.log(`✅ LLM response received successfully (attempt ${attempt + 1})`);
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message.toLowerCase();
        
        console.error(`❌ LLM request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError.message);

        // Check if it's a retryable error
        const isRetryable = 
          errorMessage.includes("503") ||
          errorMessage.includes("service unavailable") ||
          errorMessage.includes("overloaded") ||
          errorMessage.includes("rate limit") ||
          errorMessage.includes("429") ||
          errorMessage.includes("too many requests") ||
          errorMessage.includes("quota") ||
          errorMessage.includes("timeout");

        if (isRetryable && attempt < maxRetries) {
          console.log(`⚠️ Retryable error detected, will retry in ${retryDelays[attempt] || 4000}ms...`);
          continue; // Retry
        } else {
          // Not retryable or max retries reached
          if (attempt >= maxRetries) {
            console.error(`❌ Max retries (${maxRetries + 1}) reached. Giving up.`);
          }
          throw lastError;
        }
      }
    }

    if (!output) {
      const finalError = lastError || new Error("Failed to generate LLM response after retries");
      console.error("❌ No output generated after all retries:", finalError.message);
      throw finalError;
    }

    const duration = Date.now() - startTime;

    // Save workflow run to database if DATABASE_URL is configured
    let runId: string | null = null;
    const hasDatabase = !!process.env.DATABASE_URL;
    
    console.log("Database check:", { hasDatabase, userId });
    
    if (hasDatabase) {
      try {
        console.log("Attempting to save workflow run to database...");
        
        // Get or create user
        let user = await prisma.user.findUnique({
          where: { clerkId: userId },
        });

        if (!user) {
          console.log("User not found, creating new user...");
          try {
            const clerk = await clerkClient();
            const clerkUser = await clerk.users.getUser(userId);
            user = await prisma.user.create({
              data: {
                clerkId: userId,
                email: clerkUser.emailAddresses[0]?.emailAddress || null,
              },
            });
            console.log("✅ User created:", user.id);
          } catch (userError) {
            console.error("❌ Failed to create user:", userError);
            throw userError;
          }
        } else {
          console.log("✅ User found:", user.id);
        }

        // Create workflow run
        console.log("Creating workflow run with data:", {
          userId: user.id,
          nodeId: validated.nodeId,
          duration,
        });
        
        const workflowRun = await prisma.workflowRun.create({
          data: {
            userId: user.id,
            status: "success",
            scope: "single",
            duration,
            nodeIds: [validated.nodeId],
            nodeRuns: {
              create: {
                nodeId: validated.nodeId,
                nodeType: "llm",
                status: "success",
                duration,
                inputs: {
                  model: validated.model,
                  systemPrompt: validated.systemPrompt || null,
                  userMessage: validated.userMessage.substring(0, 500), // Limit user message
                  imagesCount: validated.images?.length || 0,
                },
                outputs: {
                  output: output.length > 5000 ? output.substring(0, 5000) + "... (truncated)" : output,
                },
              },
            },
          },
        });

        runId = workflowRun.id;
        console.log("✅ Workflow run saved successfully! Run ID:", runId);
      } catch (dbError) {
        console.error("❌ Error saving workflow run to database:", dbError);
        // Log full error details
        if (dbError instanceof Error) {
          console.error("Error message:", dbError.message);
          console.error("Error name:", dbError.name);
          if (dbError.stack) {
            console.error("Error stack:", dbError.stack);
          }
        }
        // Continue even if database save fails - don't break the API response
      }
    } else {
      console.warn("⚠️ DATABASE_URL not configured - workflow runs will not be saved to database");
    }

    return NextResponse.json({
      output,
      nodeId: validated.nodeId,
      runId,
      duration,
    });
  } catch (error) {
    // Save failed workflow run to database if DATABASE_URL is configured
    if (process.env.DATABASE_URL && validated) {
      try {
        const { userId } = await auth();
        if (userId) {
          let user = await prisma.user.findUnique({
            where: { clerkId: userId },
          });

          if (!user) {
            const clerk = await clerkClient();
            const clerkUser = await clerk.users.getUser(userId);
            user = await prisma.user.create({
              data: {
                clerkId: userId,
                email: clerkUser.emailAddresses[0]?.emailAddress || null,
              },
            });
          }

          const duration = Date.now() - startTime;
          
          await prisma.workflowRun.create({
            data: {
              userId: user.id,
              status: "failed",
              scope: "single",
              duration,
              nodeIds: [validated.nodeId],
              nodeRuns: {
                create: {
                  nodeId: validated.nodeId,
                  nodeType: "llm",
                  status: "failed",
                  duration,
                  inputs: {
                    model: validated.model,
                    systemPrompt: validated.systemPrompt || null,
                    userMessage: validated.userMessage,
                    imagesCount: validated.images?.length || 0,
                  },
                  error: error instanceof Error ? error.message : "Unknown error",
                },
              },
            },
          });
        }
      } catch (dbError) {
        console.error("Error saving failed workflow run to database:", dbError);
      }
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Error executing LLM:", error);
    
    // Return user-friendly error messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      // User-friendly error messages
      let userMessage = error.message;
      
      if (errorMessage.includes("503") || errorMessage.includes("service unavailable") || errorMessage.includes("overloaded")) {
        userMessage = "The AI model is currently overloaded. Please wait a few moments and try again.";
      } else if (errorMessage.includes("429") || errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
        userMessage = "Rate limit exceeded. Please wait a moment and try again.";
      } else if (errorMessage.includes("quota") || errorMessage.includes("billing")) {
        userMessage = "API quota exceeded. Please check your API key limits.";
      } else if (errorMessage.includes("invalid api key") || errorMessage.includes("authentication") || errorMessage.includes("401")) {
        userMessage = "Invalid API key. Please check your GOOGLE_GEMINI_API_KEY in environment variables.";
      } else if (errorMessage.includes("timeout")) {
        userMessage = "Request timed out. The model is taking too long to respond. Please try again.";
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("econnrefused")) {
        userMessage = "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes("model") && errorMessage.includes("not found")) {
        userMessage = "The selected model is not available. Please try a different model.";
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
