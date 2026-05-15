import { useApp } from '@/lib/contexts/app-context'
import { formatCurrency, formatPercentage, getCurrencySymbol } from '@/lib/utils'

export function useCurrency() {
  const { language } = useApp()

  const formatMoney = (value: number): string => {
    return formatCurrency(value, language)
  }

  const formatPercent = (value: number): string => {
    return formatPercentage(value, language)
  }

  const getCurrency = (): string => {
    return getCurrencySymbol(language)
  }

  return {
    formatMoney,
    formatPercent,
    getCurrency,
    language
  }
} 