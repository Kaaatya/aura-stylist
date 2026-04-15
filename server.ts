import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/auth/pinterest/url", (req, res) => {
    const clientId = process.env.PINTEREST_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL}/auth/pinterest/callback`;
    
    const params = new URLSearchParams({
      client_id: clientId || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "boards:read,pins:read",
    });

    const authUrl = `https://www.pinterest.com/oauth/?${params}`;
    res.json({ url: authUrl });
  });

  app.get("/auth/pinterest/callback", async (req, res) => {
    const { code } = req.query;
    
    // In a real app, you'd exchange the code for a token here
    // For this demo, we'll just send a success message back to the opener
    
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f2ed;">
          <div style="text-align: center;">
            <h2 style="color: #c5a059;">Aura Stylist</h2>
            <p>Pinterest connected successfully!</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'PINTEREST_AUTH_SUCCESS', code: '${code}' }, '*');
                window.close();
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
