export function detectFormat(headers: string[]): 'revolut' | 'monzo' | null {
  if (headers.includes('Started Date') && headers.includes('Completed Date')) {
    return 'revolut'
  }
  if (headers.includes('Transaction ID') && headers.includes('Money Out')) {
    return 'monzo'
  }
  return null
}
