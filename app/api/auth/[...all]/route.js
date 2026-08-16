import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth/server";

async function handle(request) {
  const auth = await getAuth();
  const { GET, POST } = toNextJsHandler(auth);
  return request.method === "GET" ? GET(request) : POST(request);
}

export { handle as GET, handle as POST };
