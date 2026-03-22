const URL = "https://adynnacxcnzlcrcqrqge.supabase.co/rest/v1";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeW5uYWN4Y256bGNyY3FycWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDY2MzksImV4cCI6MjA4OTAyMjYzOX0.ex34poZuFNqOXwhhY2wIsBjMSLiu8vrx6T0S4OHbjq8";

const RECALL_ID = "8f6c8c86-bf27-4eb4-ac86-68216fc91746";

async function main() {
  console.log("Fetching all complaints...");
  let allComplaints = [];
  let offset = 0;
  while(true) {
    const res = await fetch(`${URL}/complaints?select=id&offset=${offset}&limit=1000`, {
      headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
    });
    const c = await res.json();
    if (c.length === 0) break;
    allComplaints = allComplaints.concat(c);
    if (c.length < 1000) break;
    offset += 1000;
  }
  
  console.log(`Found ${allComplaints.length} complaints.`);
  
  // Choose ~5% randomly
  const toUpdate = allComplaints.filter(() => Math.random() < 0.05).map(c => c.id);
  console.log(`Selected ${toUpdate.length} complaints to become Recall.`);
  
  // Patch in chunks
  let updated = 0;
  for (let i = 0; i < toUpdate.length; i += 50) {
    const chunk = toUpdate.slice(i, i + 50);
    const idsStr = chunk.map(id => `"${id}"`).join(",");
    const patchRes = await fetch(`${URL}/complaints?id=in.(${idsStr})`, {
      method: "PATCH",
      headers: {
        "apikey": KEY,
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ category_id: RECALL_ID })
    });
    if (patchRes.ok) {
      updated += chunk.length;
    } else {
      console.error("Error:", await patchRes.text());
    }
  }
  console.log("Done! Updated entries.");
}
main();
