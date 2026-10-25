-- FamFinance Supabase Database Schema
-- Run this in your Supabase Project -> SQL Editor to initialize the database

-- 1. Family Members Table
CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Connected Accounts & Cards Table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  institution TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'depository')),
  mask TEXT NOT NULL,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  apr NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  min_payment NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  due_date TEXT,
  color TEXT NOT NULL DEFAULT '#1e40af',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Recurring Bills & Utilities Table (PG&E, Fresno Water, Xfinity, T-Mobile, etc.)
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  biller TEXT NOT NULL,
  category TEXT NOT NULL,
  expected_amount NUMERIC(10, 2) NOT NULL,
  due_day INT NOT NULL DEFAULT 1,
  next_due_date TEXT,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due_soon', 'paid')),
  assigned_member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  auto_pay_card_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  notes TEXT,
  last_paid_date TEXT,
  last_paid_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  bill_id TEXT REFERENCES bills(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous/authenticated reads and writes for family app (can be tightened with Supabase Auth)
CREATE POLICY "Allow family access to family_members" ON family_members FOR ALL USING (true);
CREATE POLICY "Allow family access to accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow family access to bills" ON bills FOR ALL USING (true);
CREATE POLICY "Allow family access to transactions" ON transactions FOR ALL USING (true);

-- Seed Initial 6 Family Members
INSERT INTO family_members (id, name, role, avatar, color) VALUES
  ('m1', 'Robert (Dad)', 'Parent', '👨‍💼', 'blue'),
  ('m2', 'Sarah (Mom)', 'Parent', '👩‍⚕️', 'purple'),
  ('m3', 'Alex (College)', 'Student (20)', '🧑‍🎓', 'emerald'),
  ('m4', 'Maya (High School)', 'Teen (17)', '👧', 'amber'),
  ('m5', 'Jordan (Middle)', 'Kid (14)', '👦', 'pink'),
  ('m6', 'Leo (Elementary)', 'Kid (10)', '🧒', 'cyan')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Accounts
INSERT INTO accounts (id, member_id, institution, name, type, mask, balance, credit_limit, apr, min_payment, due_date, color) VALUES
  ('acc-1', 'm1', 'Chase', 'Freedom Unlimited', 'credit', '3912', 2450.00, 8000.00, 26.49, 65.00, '2026-11-14', '#1e40af'),
  ('acc-2', 'm2', 'Capital One', 'SavorOne Rewards', 'credit', '8204', 820.50, 5000.00, 19.99, 35.00, '2026-11-20', '#991b1b'),
  ('acc-3', 'm1', 'Bank of America', 'Family Checking', 'depository', '5190', 5340.25, 0.00, 0.00, 0.00, '', '#065f46'),
  ('acc-4', 'm3', 'Discover', 'Student Chrome Card', 'credit', '1192', 310.00, 1500.00, 17.24, 25.00, '2026-11-08', '#ea580c'),
  ('acc-5', 'm4', 'Chase', 'High School Teen Checking', 'depository', '6641', 215.00, 0.00, 0.00, 0.00, '', '#4338ca')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Household Bills & Utilities
INSERT INTO bills (id, name, biller, category, expected_amount, due_day, next_due_date, frequency, status, assigned_member_id, notes) VALUES
  ('bill-1', 'Pacific Gas and Electric (PG&E)', 'PG&E', 'Utilities', 268.40, 12, '2026-11-12', 'monthly', 'due_soon', 'm1', 'Electric and Natural Gas for house'),
  ('bill-2', 'City of Fresno Water & Solid Waste', 'City of Fresno Utilities', 'Utilities', 74.20, 16, '2026-11-16', 'monthly', 'due_soon', 'm1', 'Water, trash, and sewer combined'),
  ('bill-3', 'Xfinity Gigabit Internet', 'Comcast / Xfinity', 'Utilities', 90.00, 22, '2026-11-22', 'monthly', 'upcoming', 'm2', 'Family home internet'),
  ('bill-4', 'T-Mobile Family Magenta Max (6 lines)', 'T-Mobile', 'Utilities', 185.00, 28, '2026-11-28', 'monthly', 'upcoming', 'm1', 'Covers all 6 family phones with autopay discount'),
  ('bill-5', 'Netflix Premium 4K + Family', 'Netflix', 'Subscriptions', 22.99, 5, '2026-11-05', 'monthly', 'due_soon', 'm2', 'Shared across 6 profiles'),
  ('bill-6', 'Nintendo Switch Online Family Membership', 'Nintendo', 'Gaming', 34.99, 19, '2026-11-19', 'yearly', 'upcoming', 'm1', 'Pass for kids Jordan and Leo'),
  ('bill-7', 'Spotify Family Plan', 'Spotify', 'Subscriptions', 19.99, 27, '2026-11-27', 'monthly', 'upcoming', 'm3', 'Shared music streaming for family')
ON CONFLICT (id) DO NOTHING;
