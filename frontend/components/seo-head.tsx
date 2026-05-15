import { Metadata } from 'next'

interface SEOProps {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  canonical?: string
  noIndex?: boolean
  schema?: object
}

export function generateSEOMetadata({
  title,
  description,
  keywords = [],
  ogImage = '/og-image.jpg',
  canonical,
  noIndex = false,
  schema
}: SEOProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fullTitle = `${title} | ManagerCar`
  
  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    robots: noIndex ? 'noindex,nofollow' : 'index,follow',
    authors: [{ name: 'ManagerCar' }],
    
    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: canonical || baseUrl,
      siteName: 'ManagerCar',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'pt_BR',
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    
    // Canonical URL
    alternates: canonical ? {
      canonical
    } : undefined,
    
    // JSON-LD Schema
    ...(schema && {
      other: {
        'application/ld+json': JSON.stringify(schema)
      }
    }),
    
    // Verificação de motores de busca
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    
    // As propriedades de viewport e theme-color foram movidas para a exportação "viewport" (Next 14).
  }
}

// Schemas estruturados comuns
export const createWebsiteSchema = (name: string, description: string, url: string) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": name,
  "description": description,
  "url": url,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${url}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
})

export const createOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ManagerCar",
  "description": "Gestão de veículos, vendas e oficina",
  "url": process.env.NEXT_PUBLIC_SITE_URL,
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": "Portuguese"
  }
})

export const createBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
}) 