import fs from "node:fs";
import path from "node:path";
import { DaosClient } from "./daosClient";
import { SECTIONS } from "./sections";

// Load character
const character = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "characters/daos-showcase.json"), "utf8")
);

// Pull configured values
const chatId  = character.settings.daosFunChatId as string;
const chatUrl = character.settings.daosFunChatUrl as string;
const ca      = character.settings.solana.contractAddress as string;

const daos = new DaosClient(chatId, chatUrl, ca);

// “Convert” the old Python demo into chat-native, sectioned posts
const header = `DAOS Showcase online
Room: ${daos.getRoomLink()}
Contract: ${daos.getContract()}`;

async function emitOverview() {
  const body = SECTIONS.map(s => `• ${s.title} — ${s.summary}${s.sourceHint ? ` (src: ${s.sourceHint})` : ""}`).join("\n");
  await daos.postToChat({ text: "```\n" + header + "\n\n" + body + "\n```" });
}

// Example: share one of your original source files, syntax fenced for chat
async function sharePythonDemoLabel() {
  const snippet = `# converted from your TermTk demo — label/list example
def label_demo():
    print("Layouts / Widgets demo moved to DAOS.FUN agent format")`;
  await daos.postToChat({ text: "```python\n" + snippet + "\n```" });
}

// Example: announce a contract-related “signal”
async function emitSignal(note: string) {
  await daos.postToChat({
    text: `Signal for CA ${daos.getContract()}:\n${note}`
  });
}

(async () => {
  await emitOverview();
  await sharePythonDemoLabel();
  await emitSignal("Initialized showcase agent and published overview.");
})();
