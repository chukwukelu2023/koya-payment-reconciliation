// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;

// Only the latest attempt for each txn_id counts.
const latest = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/).filter((l) => l.trim().length > 0);
for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue; // unreadable line
  }
  if (!event || !event.txn_id) continue;

  const prev = latest.get(event.txn_id);
  if (!prev || Date.parse(event.ts) > Date.parse(prev.ts)) {
    latest.set(event.txn_id, event);
  }
}

for (const event of latest.values()) {
  if (event.status === "success") {
    // Some amounts are strings with thousands separators, e.g. "12,345.67".
    total += Number(String(event.amount).replace(/,/g, ""));
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
