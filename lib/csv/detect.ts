export function detectFormat(headers: string[]): 'revolut' | 'monzo' | null {
  // English Revolut export
  if (headers.includes('Started Date') && headers.includes('Completed Date')) {
    return 'revolut'
  }
  // Portuguese Revolut export
  if (headers.includes('Data de início') && headers.includes('Data de Conclusão')) {
    return 'revolut'
  }
  if (headers.includes('Transaction ID') && headers.includes('Money Out')) {
    return 'monzo'
  }
  return null
}
