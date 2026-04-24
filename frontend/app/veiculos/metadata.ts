import { Metadata } from 'next'
import { generateSEOMetadata, createBreadcrumbSchema } from '@/components/seo-head'

export function generateVehiclesMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'Gestão de Veículos',
    description: 'ManagerCar — gestão de veículos e estoque automotivo. Cadastre, monitore e gerencie sua frota com facilidade.',
    keywords: [
      'gestão de veículos',
      'estoque automotivo', 
      'concessionária',
      'carros',
      'veículos',
      'sistema automotivo',
      'gerenciamento',
      'inventário veicular'
    ],
    ogImage: '/og-vehicles.jpg',
    canonical: '/veiculos',
    schema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Gestão de Veículos",
      "description": "Gestão de veículos e estoque automotivo com ManagerCar",
      "url": "/veiculos",
      "mainEntity": {
        "@type": "SoftwareApplication",
        "name": "ManagerCar",
        "applicationCategory": "BusinessApplication",
        "description": "Gestão para concessionárias e revendas de veículos",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "BRL"
        }
      },
      "breadcrumb": createBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Veículos", url: "/veiculos" }
      ])
    }
  })
}

export function generateVehicleDetailMetadata(vehicleId: string, vehicle?: {
  brand: string
  model: string
  year: number
  licensePlate: string
  color: string
}): Metadata {
  if (!vehicle) {
    return generateSEOMetadata({
      title: 'Detalhes do Veículo',
      description: 'Visualizar informações detalhadas do veículo',
      noIndex: true
    })
  }

  const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
  
  return generateSEOMetadata({
    title: `${vehicleName} - ${vehicle.color}`,
    description: `Detalhes completos do ${vehicleName} cor ${vehicle.color}, placa ${vehicle.licensePlate}. Informações de preço, quilometragem e histórico.`,
    keywords: [
      vehicle.brand.toLowerCase(),
      vehicle.model.toLowerCase(),
      vehicle.year.toString(),
      'veículo usado',
      'carro seminovo',
      vehicle.color.toLowerCase()
    ],
    canonical: `/veiculos/${vehicleId}`,
    schema: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": vehicleName,
      "description": `${vehicleName} cor ${vehicle.color}`,
      "brand": {
        "@type": "Brand",
        "name": vehicle.brand
      },
      "model": vehicle.model,
      "vehicleModelDate": vehicle.year,
      "color": vehicle.color,
      "vehicleIdentificationNumber": vehicle.licensePlate,
      "category": "Vehicle",
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Ano",
          "value": vehicle.year
        },
        {
          "@type": "PropertyValue", 
          "name": "Cor",
          "value": vehicle.color
        },
        {
          "@type": "PropertyValue",
          "name": "Placa",
          "value": vehicle.licensePlate
        }
      ]
    }
  })
} 