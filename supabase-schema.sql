-- =============================================
-- Database Schema for Complaint Management System
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Companies
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Branches
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Product Groups
CREATE TABLE public.product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_group_id UUID REFERENCES public.product_groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Problem Types
CREATE TABLE public.problem_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Problem Sub-types
CREATE TABLE public.problem_sub_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_type_id UUID REFERENCES public.problem_types(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Callers
CREATE TABLE public.callers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number TEXT UNIQUE,
  complaint_date TIMESTAMPTZ DEFAULT now(),
  company_id UUID REFERENCES public.companies(id),
  branch_id UUID REFERENCES public.branches(id),
  product_group_id UUID REFERENCES public.product_groups(id),
  category_id UUID REFERENCES public.categories(id),
  problem_type_id UUID REFERENCES public.problem_types(id),
  problem_sub_type_id UUID REFERENCES public.problem_sub_types(id),
  caller_id UUID REFERENCES public.callers(id),
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_complaints_company ON public.complaints(company_id);
CREATE INDEX idx_complaints_branch ON public.complaints(branch_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_date ON public.complaints(complaint_date);
CREATE INDEX idx_branches_company ON public.branches(company_id);
CREATE INDEX idx_categories_product_group ON public.categories(product_group_id);
CREATE INDEX idx_problem_sub_types_type ON public.problem_sub_types(problem_type_id);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_sub_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust as needed)
CREATE POLICY "Allow public read" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.product_groups FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.problem_types FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.problem_sub_types FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.callers FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON public.complaints FOR SELECT USING (true);

-- Allow public insert/update (adjust for auth later)
CREATE POLICY "Allow public insert" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.branches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.product_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.problem_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.problem_sub_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.callers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.complaints FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.complaints FOR UPDATE USING (true) WITH CHECK (true);
