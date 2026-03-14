import { supabase } from '@/integrations/supabase/client';
import {
  companiesData,
  branchesData,
  productGroupsData,
  categoriesData,
  problemTypesData,
  problemSubTypesData,
  callersData,
} from '@/data/seedData';
import { allComplaintsRaw } from '@/data/complaintsData';

type IdMap = Record<string, string>;

export async function importLookupData(onProgress: (msg: string) => void) {
  // 1. Companies
  onProgress('กำลัง import Companies...');
  const { data: companies } = await supabase.from('companies').upsert(
    companiesData.map(c => ({ name: c.name, code: c.code })),
    { onConflict: 'code' }
  ).select();
  const companyMap: IdMap = {};
  companies?.forEach(c => { companyMap[c.name] = c.id; });
  onProgress(`✅ Companies: ${companies?.length || 0} records`);

  // 2. Branches
  onProgress('กำลัง import Branches...');
  const branchInserts = branchesData.map(b => ({
    name: b.name,
    code: b.code,
    company_id: companyMap[b.companyName] || null,
  }));
  const { data: branches } = await supabase.from('branches').upsert(branchInserts, { onConflict: 'code' }).select();
  const branchMap: IdMap = {};
  branches?.forEach(b => { branchMap[b.name] = b.id; });
  onProgress(`✅ Branches: ${branches?.length || 0} records`);

  // 3. Product Groups
  onProgress('กำลัง import Product Groups...');
  const { data: productGroups } = await supabase.from('product_groups').upsert(
    productGroupsData.map(pg => ({ name: pg.name, code: pg.code })),
    { onConflict: 'code' }
  ).select();
  const pgMap: IdMap = {};
  productGroups?.forEach(pg => { pgMap[pg.name] = pg.id; });
  onProgress(`✅ Product Groups: ${productGroups?.length || 0} records`);

  // 4. Categories - need a product_group_id, use first one as default
  onProgress('กำลัง import Categories...');
  const defaultPgId = productGroups?.[0]?.id;
  const { data: categories } = await supabase.from('categories').upsert(
    categoriesData.map(c => ({
      name: c.name,
      code: c.code,
      product_group_id: defaultPgId,
    })),
    { onConflict: 'code' }
  ).select();
  const catMap: IdMap = {};
  categories?.forEach(c => { catMap[c.name] = c.id; });
  onProgress(`✅ Categories: ${categories?.length || 0} records`);

  // 5. Problem Types
  onProgress('กำลัง import Problem Types...');
  const { data: problemTypes } = await supabase.from('problem_types').upsert(
    problemTypesData.map(pt => ({ name: pt.name, code: pt.code })),
    { onConflict: 'code' }
  ).select();
  const ptMap: IdMap = {};
  problemTypes?.forEach(pt => { ptMap[pt.name] = pt.id; });
  onProgress(`✅ Problem Types: ${problemTypes?.length || 0} records`);

  // 6. Problem Sub-Types
  onProgress('กำลัง import Problem Sub-Types...');
  const pstInserts = problemSubTypesData.map(pst => ({
    name: pst.name,
    problem_type_id: ptMap[pst.problemTypeName] || problemTypes?.[0]?.id,
  }));
  // Insert in batches of 50
  const pstResults: any[] = [];
  for (let i = 0; i < pstInserts.length; i += 50) {
    const batch = pstInserts.slice(i, i + 50);
    const { data } = await supabase.from('problem_sub_types').insert(batch).select();
    if (data) pstResults.push(...data);
  }
  const pstMap: IdMap = {};
  pstResults.forEach(pst => { pstMap[pst.name] = pst.id; });
  onProgress(`✅ Problem Sub-Types: ${pstResults.length} records`);

  // 7. Callers
  onProgress('กำลัง import Callers...');
  const { data: callers } = await supabase.from('callers').insert(
    callersData.map(c => ({ name: c.name, company_id: companyMap['NSL'] || null }))
  ).select();
  const callerMap: IdMap = {};
  callers?.forEach(c => { callerMap[c.name] = c.id; });
  onProgress(`✅ Callers: ${callers?.length || 0} records`);

  return { companyMap, branchMap, pgMap, catMap, ptMap, pstMap, callerMap };
}

export async function importComplaints(
  maps: {
    companyMap: IdMap;
    branchMap: IdMap;
    pgMap: IdMap;
    catMap: IdMap;
    ptMap: IdMap;
    pstMap: IdMap;
    callerMap: IdMap;
  },
  onProgress: (msg: string) => void
) {
  onProgress('กำลัง import Complaints...');
  const { companyMap, branchMap, pgMap, catMap, ptMap, pstMap, callerMap } = maps;

  // Parse problem sub-type from combined format
  function findSubTypeId(combined: string): string | null {
    // Try exact match first from combined "ด้านXXX_YYY"
    const underscoreIdx = combined.indexOf('_');
    if (underscoreIdx > 0) {
      const subName = combined.substring(underscoreIdx + 1);
      if (pstMap[subName]) return pstMap[subName];
    }
    // Try full match
    if (pstMap[combined]) return pstMap[combined];
    return null;
  }

  const complaintInserts = allComplaintsRaw.map(c => ({
    complaint_number: c.docNumber || 'ไม่ระบุ',
    complaint_date: c.issueDate || null,
    company_id: companyMap[c.company] || null,
    branch_id: branchMap[c.branch] || null,
    product_group_id: pgMap[c.group] || null,
    category_id: catMap[c.category] || null,
    problem_type_id: ptMap[c.problemType] || null,
    problem_sub_type_id: findSubTypeId(c.problemSubType),
    caller_id: callerMap[c.caller] || null,
    description: c.description || 'ไม่ระบุ',
    status: c.status || 'ไม่ระบุ',
    priority: 'medium',
  }));

  // Insert in batches of 20
  let totalInserted = 0;
  for (let i = 0; i < complaintInserts.length; i += 20) {
    const batch = complaintInserts.slice(i, i + 20);
    const { data, error } = await supabase.from('complaints').insert(batch).select();
    if (error) {
      onProgress(`❌ Error batch ${i}: ${error.message}`);
    } else {
      totalInserted += data?.length || 0;
      onProgress(`📦 Complaints: ${totalInserted}/${complaintInserts.length}`);
    }
  }
  onProgress(`✅ Complaints import สำเร็จ: ${totalInserted} records`);
}
