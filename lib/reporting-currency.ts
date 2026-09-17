import { cookies } from 'next/headers'
import { getRate } from './exchange-rates'

export async function getReportingCurrency(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('reporting_currency')?.value ?? 'EUR'
}

export async function getReportingRate(reportingCurrency: string): Promise<number> {
  if (reportingCurrency === 'EUR') return 1
  return getRate('EUR', reportingCurrency)
}
