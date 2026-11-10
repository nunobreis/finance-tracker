export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment'
export type TransactionSource = 'manual' | 'csv_import'
export type ImportBatchStatus = 'pending' | 'completed' | 'failed'
export type CategoryKind = 'income' | 'expense' | 'transfer'
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type AssetType = 'stock' | 'etf' | 'fund' | 'crypto' | 'other'

export const IRS_DEDUCTION_VALUES = [
  'health', 'education',
  'housing_rent', 'housing_interest',
  'general_family',
  'iva_sector.restaurants', 'iva_sector.accommodation',
  'iva_sector.vehicles', 'iva_sector.hairdressers', 'iva_sector.gym',
  'iva_sector.veterinary', 'iva_sector.public_transport',
  'iva_sector.books', 'iva_sector.culture', 'iva_sector.press',
  'none',
] as const

export type IrsDeduction = typeof IRS_DEDUCTION_VALUES[number]

export const INCOME_TYPE_VALUES = [
  'employment_pt', 'rental_foreign', 'interest_foreign',
  'dividends_foreign', 'capital_gains_foreign', 'other_foreign', 'other',
] as const

export type IncomeType = typeof INCOME_TYPE_VALUES[number]

export type Account = {
  id: string
  user_id: string
  name: string
  institution: string | null
  account_type: AccountType
  currency: string
  country: string
  opening_balance: number
  is_active: boolean
  created_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  parent_category_id: string | null
  kind: CategoryKind
  is_system: boolean
  irs_deduction?: IrsDeduction | null
  income_type?: IncomeType | null
  exclude_from_spending?: boolean
}

export type ImportBatch = {
  id: string
  user_id: string
  account_id: string
  filename: string | null
  imported_at: string
  row_count: number | null
  status: ImportBatchStatus
}

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  occurred_on: string
  amount: number
  currency: string
  description: string | null
  merchant: string | null
  category_id: string | null
  is_transfer: boolean
  transfer_pair_id: string | null
  import_batch_id: string | null
  external_id: string | null
  source: TransactionSource
  irs_deduction_override?: IrsDeduction | null
  created_at: string
}

export type Budget = {
  id: string
  user_id: string
  category_id: string
  period_month: string
  amount_eur: number
  rollover: boolean
}

export type RecurringBill = {
  id: string
  user_id: string
  name: string
  category_id: string | null
  account_id: string | null
  amount: number
  currency: string
  frequency: RecurringFrequency
  next_due_on: string
  reminder_days_before: number
  is_active: boolean
}

export type ExchangeRate = {
  rate_date: string
  base_currency: string
  quote_currency: string
  rate: number
  source_date?: string | null
}

export type CategoryRule = {
  id: string
  user_id: string
  match_text: string
  match_key: string
  match_type: 'equals' | 'contains'
  category_id: string
  created_at: string
}

export type Holding = {
  id: string
  user_id: string
  account_id: string
  symbol: string
  name: string | null
  asset_type: AssetType
  quantity: number
  avg_cost_basis: number | null
  currency: string
}

export type HoldingPriceHistory = {
  id: string
  user_id: string
  holding_id: string
  price_date: string
  price: number
}

export type NetWorthSnapshot = {
  id: string
  user_id: string
  snapshot_date: string
  total_eur: number
  breakdown: Record<string, unknown> | null
}

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: Account
        Insert: Omit<Account, 'id' | 'created_at'>
        Update: Partial<Omit<Account, 'id'>>
        Relationships: []
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id'>
        Update: Partial<Omit<Category, 'id'>>
        Relationships: []
      }
      import_batches: {
        Row: ImportBatch
        Insert: Omit<ImportBatch, 'id' | 'imported_at'>
        Update: Partial<Omit<ImportBatch, 'id'>>
        Relationships: []
      }
      transactions: {
        Row: Transaction
        Insert: Omit<Transaction, 'id' | 'created_at'>
        Update: Partial<Omit<Transaction, 'id'>>
        Relationships: []
      }
      budgets: {
        Row: Budget
        Insert: Omit<Budget, 'id'>
        Update: Partial<Omit<Budget, 'id'>>
        Relationships: []
      }
      recurring_bills: {
        Row: RecurringBill
        Insert: Omit<RecurringBill, 'id'>
        Update: Partial<Omit<RecurringBill, 'id'>>
        Relationships: []
      }
      exchange_rates: {
        Row: ExchangeRate
        Insert: ExchangeRate
        Update: Partial<ExchangeRate>
        Relationships: []
      }
      category_rules: {
        Row: CategoryRule
        Insert: Omit<CategoryRule, 'id' | 'created_at'>
        Update: Partial<Omit<CategoryRule, 'id'>>
        Relationships: []
      }
      holdings: {
        Row: Holding
        Insert: Omit<Holding, 'id'>
        Update: Partial<Omit<Holding, 'id'>>
        Relationships: []
      }
      holding_price_history: {
        Row: HoldingPriceHistory
        Insert: Omit<HoldingPriceHistory, 'id'>
        Update: Partial<Omit<HoldingPriceHistory, 'id'>>
        Relationships: []
      }
      net_worth_snapshots: {
        Row: NetWorthSnapshot
        Insert: Omit<NetWorthSnapshot, 'id'>
        Update: Partial<Omit<NetWorthSnapshot, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
