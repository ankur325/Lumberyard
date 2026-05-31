import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { Router } from "express";

const router = Router();

/** Extracts profile/section names from an AWS ini file. Names only — never secrets. */
function parseProfileNames(content: string, isConfig: boolean): string[] {
  const names: string[] = [];
  const headerRe = /^\s*\[([^\]]+)\]\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(content)) !== null) {
    let name = m[1].trim();
    // In ~/.aws/config, profiles are written as "[profile foo]" (except default).
    if (isConfig && name.startsWith("profile ")) {
      name = name.slice("profile ".length).trim();
    }
    // Skip non-profile sections in config (e.g. "[sso-session foo]").
    if (isConfig && /^(sso-session|services)\s/.test(m[1].trim())) continue;
    names.push(name);
  }
  return names;
}

router.get("/profiles", async (_req, res) => {
  const names = new Set<string>();
  const files: Array<[string, boolean]> = [
    [join(homedir(), ".aws", "config"), true],
    [join(homedir(), ".aws", "credentials"), false],
  ];
  for (const [path, isConfig] of files) {
    try {
      const content = await readFile(path, "utf8");
      for (const n of parseProfileNames(content, isConfig)) names.add(n);
    } catch {
      // file may not exist — ignore
    }
  }
  if (names.size === 0) names.add("default");
  res.json({ profiles: [...names].sort() });
});

export default router;
