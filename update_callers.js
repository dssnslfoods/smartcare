
const URL = "https://adynnacxcnzlcrcqrqge.supabase.co/rest/v1";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeW5uYWN4Y256bGNyY3FycWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDY2MzksImV4cCI6MjA4OTAyMjYzOX0.ex34poZuFNqOXwhhY2wIsBjMSLiu8vrx6T0S4OHbjq8";

async function updateCallers() {
  console.log("Fetching callers...");
  const callersRes = await fetch(`${URL}/callers?select=id`, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  });
  const callers = await callersRes.json();
  const callerIds = callers.map(c => c.id);

  if (callerIds.length === 0) {
    console.error("No callers found.");
    return;
  }

  console.log("Fetching all complaints...");
  const complaintsRes = await fetch(`${URL}/complaints?select=id`, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  });
  const complaints = await complaintsRes.json();
  console.log(`Found ${complaints.length} complaints to update.`);

  const updatesByCaller = {};
  complaints.forEach(c => {
    const chosen = callerIds[Math.floor(Math.random() * callerIds.length)];
    if (!updatesByCaller[chosen]) updatesByCaller[chosen] = [];
    updatesByCaller[chosen].push(c.id);
  });

  let totalUpdated = 0;
  for (const [callerId, ids] of Object.entries(updatesByCaller)) {
    // Split into chunks of 50
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const idsStr = chunk.map(id => `"${id}"`).join(",");
      
      const patchRes = await fetch(`${URL}/complaints?id=in.(${idsStr})`, {
        method: "PATCH",
        headers: {
          "apikey": KEY,
          "Authorization": `Bearer ${KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ caller_id: callerId })
      });

      if (patchRes.ok) {
        totalUpdated += chunk.length;
        console.log(`Updated ${totalUpdated}/${complaints.length}...`);
      } else {
        const err = await patchRes.text();
        console.error(`Error updating: ${err}`);
      }
    }
  }

  console.log("✅ Caller update complete!");
}

updateCallers();
