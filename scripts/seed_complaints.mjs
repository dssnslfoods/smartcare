import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://adynnacxcnzlcrcqrqge.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeW5uYWN4Y256bGNyY3FycWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDY2MzksImV4cCI6MjA4OTAyMjYzOX0.ex34poZuFNqOXwhhY2wIsBjMSLiu8vrx6T0S4OHbjq8'
);

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function fmtDate(d) { return d.toISOString().split('T')[0]; }

// Weighted random: weights array same length as items
function weightedRand(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

async function main() {
  // ── Load all lookup tables ──────────────────────────────────────────
  const [companies, branches, productGroups, categories, problemTypes, problemSubTypes, callers, statuses, priorities] =
    await Promise.all([
      supabase.from('companies').select('id, name'),
      supabase.from('branches').select('id, name, company_id'),
      supabase.from('product_groups').select('id, name'),
      supabase.from('categories').select('id, name'),
      supabase.from('problem_types').select('id, name, category_id'),
      supabase.from('problem_sub_types').select('id, name, problem_type_id'),
      supabase.from('callers').select('id, name'),
      supabase.from('statuses').select('id, name, code'),
      supabase.from('priorities').select('id, name, code'),
    ]);

  const C = companies.data, B = branches.data, PG = productGroups.data;
  const CAT = categories.data, PT = problemTypes.data, PST = problemSubTypes.data;
  const CA = callers.data, ST = statuses.data, PRI = priorities.data;

  console.log(`Loaded: ${C?.length} companies, ${B?.length} branches, ${PG?.length} product groups`);
  console.log(`        ${CAT?.length} categories, ${PT?.length} problem types, ${PST?.length} sub types`);
  console.log(`        ${CA?.length} callers, ${ST?.length} statuses, ${PRI?.length} priorities`);

  if (!C?.length || !PG?.length || !CAT?.length || !PT?.length || !CA?.length || !ST?.length || !PRI?.length) {
    console.error('❌ Missing lookup data. Please add master data first.');
    process.exit(1);
  }

  // ── Build cascade maps ─────────────────────────────────────────────
  const branchesByCompany = {};
  for (const b of B) {
    if (!branchesByCompany[b.company_id]) branchesByCompany[b.company_id] = [];
    branchesByCompany[b.company_id].push(b);
  }

  const problemTypesByCategory = {};
  for (const pt of PT) {
    const key = pt.category_id || '__none__';
    if (!problemTypesByCategory[key]) problemTypesByCategory[key] = [];
    problemTypesByCategory[key].push(pt);
  }

  const subTypesByProblemType = {};
  for (const pst of PST) {
    if (!subTypesByProblemType[pst.problem_type_id]) subTypesByProblemType[pst.problem_type_id] = [];
    subTypesByProblemType[pst.problem_type_id].push(pst);
  }

  // ── Status/Priority weights (realistic distribution) ──────────────
  // More closed than open, more low/medium priority
  const statusWeights = ST.map(s => {
    if (s.code === 'closed_manufacturer') return 35;
    if (s.code === 'not_closed_manufacturer') return 20;
    if (s.code === 'closed_rd') return 15;
    if (s.code === 'expected_closed_manufacturer') return 20;
    if (s.code === 'expected_not_closed_manufacturer') return 10;
    return 10;
  });
  const priorityWeights = PRI.map(p => {
    if (p.code === 'low') return 30;
    if (p.code === 'medium') return 40;
    if (p.code === 'high') return 22;
    if (p.code === 'critical') return 8;
    return 10;
  });

  // ── Descriptions & resolutions ────────────────────────────────────
  const descriptions = [
    'ลูกค้าพบสิ่งแปลกปลอมในผลิตภัณฑ์ เป็นวัตถุแข็งสีดำ',
    'ผลิตภัณฑ์มีกลิ่นผิดปกติ ไม่ตรงตามมาตรฐาน',
    'บรรจุภัณฑ์ชำรุด สินค้ารั่วซึม ทำให้สินค้าเสียหาย',
    'สีของผลิตภัณฑ์ผิดปกติ ต่างจากที่ระบุบนฉลาก',
    'น้ำหนักสุทธิไม่ตรงตามที่ระบุบนฉลาก ขาดน้ำหนักประมาณ 5-10 กรัม',
    'ผลิตภัณฑ์เสื่อมสภาพก่อนวันหมดอายุที่ระบุ',
    'พบเส้นผมในผลิตภัณฑ์',
    'ผลิตภัณฑ์มีรสชาติผิดปกติ เปรี้ยวเกินไป',
    'ฉลากไม่ครบถ้วน ขาดข้อมูลส่วนประกอบสำคัญ',
    'พบเชื้อราบนผิวผลิตภัณฑ์ทั้งที่ยังไม่หมดอายุ',
    'ผลิตภัณฑ์แข็งตัวผิดปกติ เนื้อสัมผัสไม่ถูกต้อง',
    'ลูกค้าแพ้อาหารหลังรับประทานผลิตภัณฑ์',
    'กล่องบรรจุภัณฑ์บุบ ทำให้ผลิตภัณฑ์เสียหาย',
    'ปริมาณน้ำมันในผลิตภัณฑ์มากเกินไป ผิดจากสูตรมาตรฐาน',
    'ผลิตภัณฑ์ติดกันเป็นก้อน ไม่สามารถแยกออกจากกันได้',
    'พบโลหะชิ้นเล็กในผลิตภัณฑ์',
    'สติกเกอร์วันหมดอายุหลุดออก ไม่สามารถตรวจสอบได้',
    'ผลิตภัณฑ์มีฟองผิดปกติ',
    'บรรจุภัณฑ์ไม่ปิดสนิท อากาศเข้าได้',
    'สีผลิตภัณฑ์จางกว่าปกติมาก ดูด้อยคุณภาพ',
    'ลูกค้าพบพลาสติกชิ้นเล็กในผลิตภัณฑ์',
    'ผลิตภัณฑ์มีความหวานน้อยกว่ามาตรฐาน',
    'รอยซีลบรรจุภัณฑ์ไม่สมบูรณ์ เปิดได้ง่ายเกินไป',
    'พบแมลงในบรรจุภัณฑ์ที่ปิดสนิท',
    'ผลิตภัณฑ์มีความชื้นสูงผิดปกติ',
  ];

  const resolutions = [
    'ทำการสอบสวนกระบวนการผลิต พบสาเหตุจากสายพานลำเลียงชำรุด ดำเนินการซ่อมแซมและตรวจสอบล็อตการผลิต',
    'ตรวจสอบแหล่งที่มาของวัตถุดิบ ปรับปรุงกระบวนการคัดแยกและตรวจสอบคุณภาพ',
    'ปรับปรุงกระบวนการบรรจุภัณฑ์ เพิ่มการตรวจสอบรอยซีลก่อนส่งออก',
    'ตรวจสอบสูตรการผลิตและวัตถุดิบ ทำการ recall สินค้าล็อตที่ได้รับผลกระทบ',
    'สอบสวนกระบวนการชั่งและบรรจุ ปรับเทียบเครื่องชั่งและดำเนินการแก้ไข',
    'ตรวจสอบระบบการเก็บรักษาและขนส่ง ปรับปรุงการควบคุมอุณหภูมิ',
    'ดำเนินการสอบสวน พบสาเหตุจากพนักงานไม่สวมหมวกคลุมผม เพิ่มมาตรการ GMP',
    'ทบทวนสูตรการผลิตและปรับปรุงสัดส่วนส่วนผสม',
    'ตรวจสอบและปรับปรุงกระบวนการพิมพ์ฉลาก เพิ่มการตรวจสอบความสมบูรณ์ของฉลาก',
    'สอบสวนกระบวนการผลิต ปรับปรุงการควบคุมความชื้นในโรงงาน',
    'ตรวจสอบพารามิเตอร์กระบวนการ ปรับปรุงเงื่อนไขการผลิต',
    'ส่งผลิตภัณฑ์ตัวอย่างทดสอบส่วนประกอบที่อาจก่อให้เกิดการแพ้ ปรับปรุงฉลากแจ้งเตือน',
    'ปรับปรุงบรรจุภัณฑ์ให้แข็งแรงขึ้น เพิ่มการป้องกันระหว่างการขนส่ง',
    'ตรวจสอบอัตราส่วนวัตถุดิบ ปรับปรุงกระบวนการผสม',
    'ปรับปรุงกระบวนการผลิตและการเก็บรักษา ควบคุมความชื้นให้เหมาะสม',
    'ตรวจสอบอุปกรณ์การผลิต พบชิ้นส่วนโลหะสึกหรอ ดำเนินการเปลี่ยนและตรวจสอบทุกล็อต',
    'ปรับปรุงกระบวนการติดฉลากและตรวจสอบก่อนจัดส่ง',
    'ตรวจสอบกระบวนการผลิต ปรับปรุงการควบคุมแก๊สในบรรจุภัณฑ์',
    'ปรับปรุงกระบวนการซีลบรรจุภัณฑ์ เพิ่มการตรวจสอบความแน่นของบรรจุภัณฑ์',
    'ตรวจสอบและปรับปรุงสีผสมอาหารที่ใช้ ทดสอบความเสถียรของสี',
    'ตรวจสอบอุปกรณ์และสายการผลิต พบแหล่งที่มาและดำเนินการแก้ไข',
    'ปรับสูตรการผลิต เพิ่มปริมาณสารให้ความหวานตามมาตรฐาน',
    'ปรับปรุงเครื่องซีลบรรจุภัณฑ์ เพิ่มการตรวจสอบแรงดันซีล',
    'ดำเนินการสอบสวนอย่างเร่งด่วน ตรวจสอบระบบป้องกันแมลงในโรงงาน',
    'ปรับปรุงระบบควบคุมความชื้นในกระบวนการผลิตและการเก็บรักษา',
  ];

  // ── Generate complaints ───────────────────────────────────────────
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-12-31');
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Seasonal weights (more complaints mid-year and Q4)
  const monthWeights = [6, 5, 7, 8, 9, 10, 11, 10, 9, 10, 9, 8]; // Jan-Dec

  const TARGET = 1200;
  const records = [];

  // pre-generate dates with monthly weighting
  const dates = [];
  for (let i = 0; i < TARGET; i++) {
    const month = weightedRand([0,1,2,3,4,5,6,7,8,9,10,11], monthWeights);
    const year = Math.random() < 0.5 ? 2024 : 2025; // roughly equal split
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = randInt(1, daysInMonth);
    dates.push(new Date(year, month, day));
  }
  dates.sort((a, b) => a - b);

  let docNum = 1;
  for (let i = 0; i < TARGET; i++) {
    const company = rand(C);
    const companyBranches = branchesByCompany[company.id] || [];
    const branch = companyBranches.length > 0 ? rand(companyBranches) : null;
    const productGroup = rand(PG);
    const category = rand(CAT);

    const catProblemTypes = problemTypesByCategory[category.id] || problemTypesByCategory['__none__'] || PT;
    const problemType = catProblemTypes.length > 0 ? rand(catProblemTypes) : rand(PT);

    const ptSubTypes = subTypesByProblemType[problemType.id] || [];
    const subType = ptSubTypes.length > 0 ? rand(ptSubTypes) : null;

    const caller = rand(CA);
    const status = weightedRand(ST, statusWeights);
    const priority = weightedRand(PRI, priorityWeights);

    const complaintDate = dates[i];
    const year = complaintDate.getFullYear();
    const month = String(complaintDate.getMonth() + 1).padStart(2, '0');
    const seq = String(docNum++).padStart(3, '0');
    const complaintNumber = `QAS.${year}.${month}/${seq}`;

    // Resolved date: 3-45 days after complaint date depending on priority
    const resolveDays = priority.code === 'critical' ? randInt(1, 7)
      : priority.code === 'high' ? randInt(3, 14)
      : priority.code === 'medium' ? randInt(7, 30)
      : randInt(14, 45);

    const resolvedDate = addDays(complaintDate, resolveDays);
    const isResolved = ['closed_manufacturer', 'not_closed_manufacturer', 'closed_rd'].includes(status.code);

    const record = {
      complaint_number: complaintNumber,
      complaint_date: fmtDate(complaintDate),
      company_id: company.id,
      branch_id: branch?.id || null,
      product_group_id: productGroup.id,
      category_id: category.id,
      problem_type_id: problemType.id,
      problem_sub_type_id: subType?.id || null,
      caller_id: caller.id,
      description: rand(descriptions),
      status: status.name,
      priority: priority.code,
      resolution: rand(resolutions),
      resolved_at: isResolved ? fmtDate(resolvedDate) : null,
    };

    records.push(record);
  }

  // ── Insert in batches of 50 ────────────────────────────────────────
  const BATCH = 50;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase.from('complaints').insert(batch);
    if (error) {
      console.error(`❌ Batch ${Math.floor(i/BATCH)+1} failed:`, error.message);
      failed += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`\r✅ Inserted: ${inserted}/${TARGET}`);
    }
  }

  console.log(`\n\nDone! Inserted: ${inserted}, Failed: ${failed}`);
}

main().catch(console.error);
