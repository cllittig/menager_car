import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


const CURRENCY_CONFIG = {
  pt: { currency: 'BRL', locale: 'pt-BR' },
  en: { currency: 'USD', locale: 'en-US' },
  es: { currency: 'EUR', locale: 'es-ES' }
} as const


export function formatCurrency(value: number, language: 'pt' | 'en' | 'es' = 'pt'): string {
  const config = CURRENCY_CONFIG[language]

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}


export function formatPercentage(value: number, language: 'pt' | 'en' | 'es' = 'pt'): string {
  const locale = CURRENCY_CONFIG[language].locale

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100)
}


export function getCurrencySymbol(language: 'pt' | 'en' | 'es' = 'pt'): string {
  const symbols = {
    pt: 'R$',
    en: '$',
    es: '€'
  }
  return symbols[language]
}
