
const URL = "https://adynnacxcnzlcrcqrqge.supabase.co/rest/v1";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeW5uYWN4Y256bGNyY3FycWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDY2MzksImV4cCI6MjA4OTAyMjYzOX0.ex34poZuFNqOXwhhY2wIsBjMSLiu8vrx6T0S4OHbjq8";

async function updateSubTypes() {
  console.log("Fetching sub-types...");
  const subTypesRes = await fetch(`${URL}/problem_sub_types?select=id,problem_type_id`, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  });
  const subTypes = await subTypesRes.json();

  const mapping = {};
  subTypes.forEach(st => {
    if (!mapping[st.problem_type_id]) mapping[st.problem_type_id] = [];
    mapping[st.problem_type_id].push(st.id);
  });

  console.log("Fetching complaints with null sub-type...");
  const complaintsRes = await fetch(`${URL}/complaints?problem_sub_type_id=is.null&select=id,problem_type_id`, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  });
  const complaints = await complaintsRes.json();
  console.log(`Found ${complaints.length} complaints to update.`);

  const updatesBySub = {};
  complaints.forEach(c => {
    const subs = mapping[c.problem_type_id];
    if (subs && subs.length > 0) {
      const chosen = subs[Math.floor(Math.random() * subs.length)];
      if (!updatesBySub[chosen]) updatesBySub[chosen] = [];
      updatesBySub[chosen].push(c.id);
    }
  });

  let totalUpdated = 0;
  for (const [subId, ids] of Object.entries(updatesBySub)) {
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
        body: JSON.stringify({ problem_sub_type_id: subId })
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

  console.log("✅ Update complete!");
}

updateSubTypes();
