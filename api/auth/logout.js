// Bundled for Vercel Serverless
import { createRequire } from 'module';
const require = createRequire(import.meta.url);


// api/auth/logout.ts
var COOKIE_NAME = "app_session_id";
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const cookieParts = [
    `${COOKIE_NAME}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "SameSite=None"
  ];
  res.setHeader("Set-Cookie", cookieParts.join("; "));
  return res.json({ success: true });
}
export {
  handler as default
};
