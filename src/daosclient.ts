// NOTE: DAOS.FUN doesn’t publish a stable public chat API.
// This client centralizes where you would plug in your posting method
// (e.g., wallet-authenticated WebSocket, internal webhook, or your own relay).

export type Post = { text: string };

export class DaosClient {
  constructor(
    private chatId: string,
    private chatUrl: string,
    private contractAddress: string
  ) {}

  // For convenience in logs / links
  getRoomLink() { return this.chatUrl; }
  getContract() { return this.contractAddress; }

  // TODO: replace this with your actual post method
  async postToChat(msg: Post) {
    // e.g., your internal bridge: await fetch(YOUR_BRIDGE, {method:"POST", body: JSON.stringify({...})})
    console.log(`(stub) Would post to ${this.chatUrl}:\n${msg.text}\n`);
    return { ok: true };
  }
}
