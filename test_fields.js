const URL = "https://adynnacxcnzlcrcqrqge.supabase.co/rest/v1";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeW5uYWN4Y256bGNyY3FycWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDY2MzksImV4cCI6MjA4OTAyMjYzOX0.ex34poZuFNqOXwhhY2wIsBjMSLiu8vrx6T0S4OHbjq8";

async function main() {
  const res = await fetch(`${URL}/statuses?select=id,is_default,sort_order&limit=1`, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  });
  console.log("Statuses result:", await res.text());
}
main();
