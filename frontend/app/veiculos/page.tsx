import VeiculosPageClient from './client-page'
import { generateVehiclesMetadata } from './metadata'

export const metadata = generateVehiclesMetadata()

export default function VeiculosPage() {
  return <VeiculosPageClient />
} 