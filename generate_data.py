
import json
import random
from datetime import datetime, timedelta

# Verified IDs
COMPANY_ID = "6e3a28f2-83a1-471b-8bcd-1ef91e95507d" # NSL
BRANCH_IDS = ["7362245a-cd80-4c5c-b2ac-3d462f3cd2d2", "5790bd3e-b28b-4930-8b8b-3eb4de5246e1"] # Branch 1, 2
PRODUCT_GROUP_IDS = [
    "646b15db-32bf-4901-b587-5c6c21881237", "e98ae936-84f3-4097-95cd-2369c0822322",
    "ed7f2a9c-940c-48dc-b000-1ca55026aca9"
]
CATEGORY_IDS = [
    "6f69b15a-b282-4a80-8ba0-74a3d896f352", "ff61ef40-8d8d-46e4-94e5-0ca6bd5fdbf8",
    "d31a5a59-8d09-4b92-9657-4f54faf68df0", "08344d9c-bbaa-46ce-8b29-c25c9be3a96f"
]
PROBLEM_TYPE_IDS = [
    "07fed574-8bb7-4e3d-af57-2dd8d32f2aa0", "b482e4b5-8372-4a63-98e5-592524e31feb",
    "6b9485de-f208-4db6-ad8c-2df3573a9de5"
]
CALLER_ID = "1f735cd6-5d1d-41e5-9131-43044161a2dd"

STATUSES = ["ปิดผู้ผลิต", "ไม่เปิดผู้ผลิต", "รอดำเนินการ"]
PRIORITIES = ["low", "medium", "high"]

def random_date(start_year, end_year):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    return start + timedelta(seconds=random_second)

complaints = []
for i in range(800):
    year = 2024 if i < 350 else 2025
    date = random_date(year, year)
    
    status = random.choice(STATUSES)
    resolved_at = None
    if status == "ปิดผู้ผลิต":
        resolved_at = (date + timedelta(days=random.randint(1, 15))).isoformat()
    
    complaints.append({
        "complaint_number": f"CP-{year}-{i+1:04d}",
        "complaint_date": date.isoformat(),
        "company_id": COMPANY_ID,
        "branch_id": random.choice(BRANCH_IDS),
        "product_group_id": random.choice(PRODUCT_GROUP_IDS),
        "category_id": random.choice(CATEGORY_IDS),
        "problem_type_id": random.choice(PROBLEM_TYPE_IDS),
        "caller_id": CALLER_ID,
        "status": status,
        "priority": random.choice(PRIORITIES),
        "description": f"รายการทดสอบระบบปี {year} #{i+1}",
        "resolution": "แก้ไขเสร็จสิ้น" if status == "ปิดผู้ผลิต" else None,
        "resolved_at": resolved_at
    })

for i in range(0, len(complaints), 100):
    chunk = complaints[i:i+100]
    with open(f"/tmp/chunk_{i//100}.json", "w") as f:
        json.dump(chunk, f)

print(f"Generated {len(complaints)} records in 8 chunks.")
