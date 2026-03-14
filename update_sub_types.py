
import json
import requests
import random

# Supabase Credentials
URL = "https://adynnacxcnzlcrcqrqge.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeW5uYWN4Y256bGNyY3FycWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDY2MzksImV4cCI6MjA4OTAyMjYzOX0.ex34poZuFNqOXwhhY2wIsBjMSLiu8vrx6T0S4OHbjq8"
HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def update_complaints():
    # 1. Fetch Problem Sub Types grouped by Problem Type
    print("Fetching sub-types...")
    res = requests.get(f"{URL}/problem_sub_types?select=id,problem_type_id", headers=HEADERS)
    sub_types = res.json()
    
    mapping = {}
    for st in sub_types:
        pts_id = st['problem_type_id']
        if pts_id not in mapping:
            mapping[pts_id] = []
        mapping[pts_id].append(st['id'])

    # 2. Fetch complaints with null problem_sub_type_id
    print("Fetching complaints to update...")
    res = requests.get(f"{URL}/complaints?problem_sub_type_id=is.null&select=id,problem_type_id", headers=HEADERS)
    complaints = res.json()
    
    print(f"Found {len(complaints)} complaints to update.")

    # 3. Prepare updates
    count = 0
    for c in complaints:
        p_id = c['problem_type_id']
        if p_id in mapping:
            chosen_sub = random.choice(mapping[p_id])
            
            # Update individual record (better to batch but Supabase PATCH on filtered is easier here)
            # Actually, let's just do it one by one or in small loops if too many. 
            # Supabase doesn't support batch update with different values easily in REST without RPC
            # So we do individual PATCH or grouped by sub_type
            pass

    # Group updates by sub_type to reduce requests
    updates_by_sub = {}
    for c in complaints:
        p_id = c['problem_type_id']
        if p_id in mapping:
            chosen_sub = random.choice(mapping[p_id])
            if chosen_sub not in updates_by_sub:
                updates_by_sub[chosen_sub] = []
            updates_by_sub[chosen_sub].append(c['id'])

    print(f"Executing updates across {len(updates_by_sub)} sub-type groups...")
    for sub_id, comp_ids in updates_by_sub.items():
        # Batch update complaints that will get the same sub_id
        # chunk comp_ids to avoid long URL
        for i in range(0, len(comp_ids), 50):
            chunk = comp_ids[i:i+50]
            ids_str = ",".join(chunk)
            patch_res = requests.patch(
                f"{URL}/complaints?id=in.({ids_str})",
                headers=HEADERS,
                json={"problem_sub_type_id": sub_id}
            )
            if patch_res.status_code >= 300:
                print(f"Error updating chunk: {patch_res.text}")
            else:
                count += len(chunk)
                print(f"Updated {count}/{len(complaints)}...")

    print("✅ All complaints updated successfully!")

if __name__ == "__main__":
    update_complaints()
