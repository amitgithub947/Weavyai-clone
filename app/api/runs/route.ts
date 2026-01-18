import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Route handler for fetching workflow runs
export async function GET() {
  try {
    // Safely get user ID
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch (authError) {
      console.error("❌ Auth error:", authError);
      // If auth fails, return empty array instead of 500
      return NextResponse.json([]);
    }
    
    if (!userId) {
      // User not authenticated - return empty array (not an error)
      return NextResponse.json([]);
    }

    // If DATABASE_URL is not configured yet, return an empty list
    if (!process.env.DATABASE_URL) {
      console.log("DATABASE_URL not configured, returning empty runs list");
      return NextResponse.json([]);
    }

    try {
      console.log("🔍 Fetching workflow runs for user:", userId);
      console.log("🔍 DATABASE_URL configured:", !!process.env.DATABASE_URL);

      // Test database connection first (only if DATABASE_URL is configured)
      if (process.env.DATABASE_URL) {
        try {
          await prisma.$connect();
          console.log("✅ Database connection successful");
        } catch (connectError) {
          console.error("❌ Database connection failed:", connectError);
          if (connectError instanceof Error) {
            console.error("Connection error details:", connectError.message);
          }
          // Return empty array instead of error
          return NextResponse.json([]);
        }
      }

      // Get or create user (only if DATABASE_URL is configured)
      if (!process.env.DATABASE_URL) {
        return NextResponse.json([]);
      }

      let user;
      try {
        user = await prisma.user.findUnique({
          where: { clerkId: userId },
        });
      } catch (findError) {
        console.error("❌ Error finding user:", findError);
        return NextResponse.json([]);
      }

      if (!user) {
        console.log("ℹ️ User not found in database, creating new user...");
        try {
          // Import clerkClient dynamically to avoid issues
          const { clerkClient } = await import("@clerk/nextjs/server");
          const clerk = await clerkClient();
          const clerkUser = await clerk.users.getUser(userId);
          
          user = await prisma.user.create({
            data: {
              clerkId: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || null,
            },
          });
          console.log("✅ New user created:", user.id);
        } catch (userError) {
          console.error("❌ Failed to create user:", userError);
          // If user creation fails, still return empty array (user might have runs from before)
          return NextResponse.json([]);
        }
      }

      console.log("✅ User found, fetching runs for user ID:", user.id);

      let runs;
      try {
        runs = await prisma.workflowRun.findMany({
          where: {
            userId: user.id,
          },
          orderBy: { createdAt: "desc" },
          take: 25,
          include: {
            nodeRuns: {
              orderBy: { createdAt: "desc" },
            },
          },
        });
        console.log(`✅ Found ${runs.length} workflow runs`);
      } catch (runsError) {
        console.error("❌ Error fetching runs:", runsError);
        return NextResponse.json([]);
      }

      return NextResponse.json(runs);
    } catch (dbError) {
      // Handle database connection errors gracefully
      console.error("❌ Database error fetching workflow runs:", dbError);
      
      if (dbError instanceof Error) {
        console.error("Error name:", dbError.name);
        console.error("Error message:", dbError.message);
        
        // Check if it's a "table does not exist" error (P2021)
        const prismaError = dbError as { code?: string; message: string };
        if (
          dbError.message.includes("does not exist") ||
          dbError.message.includes("P2021") ||
          prismaError.code === "P2021"
        ) {
          console.error("❌ Database tables do not exist. Please run: npx prisma db push");
          console.error("This error means the database schema needs to be created.");
          return NextResponse.json([]);
        }
        
        // If it's a connection error, return empty array instead of 500
        if (
          dbError.message.includes("connect") ||
          dbError.message.includes("connection") ||
          dbError.message.includes("timeout") ||
          dbError.message.includes("P1001") || // Prisma connection error code
          dbError.message.includes("Can't reach database server") ||
          dbError.name === "PrismaClientInitializationError"
        ) {
          console.warn("⚠️ Database connection issue, returning empty runs list");
          return NextResponse.json([]);
        }
        
        // For other Prisma errors, log but still return empty array
        if (dbError.name === "PrismaClientKnownRequestError") {
          console.warn("⚠️ Prisma error (might be recoverable), returning empty runs list");
          return NextResponse.json([]);
        }
      }
      
      // For other database errors, still return empty array to avoid breaking the UI
      console.warn("⚠️ Unknown database error, returning empty runs list");
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("❌ Unexpected error in GET /api/runs:", error);
    
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      if (error.stack) {
        console.error("Error stack:", error.stack.substring(0, 500));
      }
    }
    
    // Always return empty array instead of 500 error to prevent UI breaking
    return NextResponse.json([], { status: 200 });
  }
}

// Route handler for deleting all workflow runs for the authenticated user
export async function DELETE() {
  try {
    // Safely get user ID
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch (authError) {
      console.error("❌ Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // If DATABASE_URL is not configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    try {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Delete all workflow runs for this user
      // This will cascade delete NodeRuns due to onDelete: Cascade in schema
      const deleteResult = await prisma.workflowRun.deleteMany({
        where: {
          userId: user.id,
        },
      });

      console.log(`✅ Deleted ${deleteResult.count} workflow runs for user ${user.id}`);

      return NextResponse.json({
        success: true,
        deletedCount: deleteResult.count,
        message: `Successfully deleted ${deleteResult.count} workflow run${deleteResult.count !== 1 ? "s" : ""}`,
      });
    } catch (dbError) {
      console.error("❌ Database error deleting workflow runs:", dbError);
      
      if (dbError instanceof Error) {
        return NextResponse.json(
          { error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to delete workflow runs" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Unexpected error in DELETE /api/runs:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Unexpected error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

