import { createClerkClient } from "@clerk/nextjs/server";

export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});
