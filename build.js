import { cp, mkdir, rm } from "node:fs/promises";
const files = ["index.html", "app.js", "cloud-store.js", "finance.js", "register.js", "register-model.js", "style.css", "supabase/setup.sql"];
await rm("dist", { recursive: true, force: true });
await mkdir("dist/supabase", { recursive: true });
for (const file of files) await cp(file, `dist/${file}`);
console.log("Site estático pronto em dist/");
