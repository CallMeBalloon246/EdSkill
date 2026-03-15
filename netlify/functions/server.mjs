import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import register from "./netlify/functions/register.mjs";
import login from "./netlify/functions/login.mjs";
import me from "./netlify/functions/me.mjs";
import logout from "./netlify/functions/logout.mjs";
import createSkill from "./netlify/functions/create-skill.mjs";
import mySkills from "./netlify/functions/my-skills.mjs";
import listSkills from "./netlify/functions/list-skills.mjs";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function wrapNetlifyHandler(handler) {
  return async (req, res, next) => {
    try {
      const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      const headers = new Headers();

      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else if (value != null) {
          headers.set(key, String(value));
        }
      }

      let body;
      if (!["GET", "HEAD"].includes(req.method)) {
        const contentType = req.headers["content-type"] || "";

        if (contentType.includes("application/json")) {
          body = JSON.stringify(req.body ?? {});
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          body = new URLSearchParams(req.body).toString();
        }
      }

      const webRequest = new Request(url, {
        method: req.method,
        headers,
        body
      });

      const webResponse = await handler(webRequest);

      res.status(webResponse.status);

      webResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") {
          res.append("Set-Cookie", value);
        } else {
          res.setHeader(key, value);
        }
      });

      const buffer = Buffer.from(await webResponse.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}

app.get("/healthz", (req, res) => {
  res.json({ ok: true });
});

/* Giữ nguyên path cũ để frontend không phải sửa */
app.all("/.netlify/functions/register", wrapNetlifyHandler(register));
app.all("/.netlify/functions/login", wrapNetlifyHandler(login));
app.all("/.netlify/functions/me", wrapNetlifyHandler(me));
app.all("/.netlify/functions/logout", wrapNetlifyHandler(logout));
app.all("/.netlify/functions/create-skill", wrapNetlifyHandler(createSkill));
app.all("/.netlify/functions/my-skills", wrapNetlifyHandler(mySkills));
app.all("/.netlify/functions/list-skills", wrapNetlifyHandler(listSkills));

app.use(express.static(publicDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`EdSkill running on port ${PORT}`);
});