import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import { memo, useCallback } from 'react'

interface VehicleFiltersProps {
  searchTerm: string
  statusFilter: string
  dateFromFilter: string
  dateToFilter: string
  totalCount: number
  filteredCount: number
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onClearFilters: () => void
  className?: string
}

export const VehicleFilters = memo<VehicleFiltersProps>(({
  searchTerm,
  statusFilter,
  dateFromFilter,
  dateToFilter,
  totalCount,
  filteredCount,
  onSearchChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
  className
}) => {
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateFromFilter || dateToFilter

  const handleClearFilters = useCallback(() => {
    onClearFilters()
  }, [onClearFilters])

  return (
    <Card className={cn('transition-shadow duration-200 fade-in hover:shadow-elevation2', className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Busca e Status */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Label htmlFor="search">Buscar veículos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por marca, modelo, placa ou cor..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 focus-ring transition-all duration-200"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => onSearchChange('')}
                    title="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Label htmlFor="status-filter">Filtrar por status</Label>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="AVAILABLE">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      Disponível
                    </div>
                  </SelectItem>
                  <SelectItem value="SOLD">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-info" />
                      Vendido
                    </div>
                  </SelectItem>
                  <SelectItem value="MAINTENANCE">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-warning" />
                      Manutenção
                    </div>
                  </SelectItem>
                  <SelectItem value="RESERVED">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      Reservado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Filtros de Data */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="date-from">Data de entrada - De</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFromFilter}
                onChange={(e) => onDateFromChange(e.target.value)}
                placeholder="Data inicial"
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="date-to">Data de entrada - Até</Label>
              <Input
                id="date-to"
                type="date"
                value={dateToFilter}
                onChange={(e) => onDateToChange(e.target.value)}
                placeholder="Data final"
                min={dateFromFilter || undefined}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="whitespace-nowrap"
                title="Limpar todos os filtros"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
          
          {/* Contador de Resultados */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {filteredCount} de {totalCount} veículos
                {hasActiveFilters ? (
                  <span className="font-medium text-primary"> (filtrados)</span>
                ) : null}
              </span>
              
              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">Filtros ativos:</span>
                  <div className="flex gap-1">
                    {searchTerm ? (
                      <Badge variant="info" className="gap-1 pr-1 font-normal">
                        Busca: &quot;{searchTerm}&quot;
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-transparent"
                          onClick={() => onSearchChange('')}
                          aria-label="Remover filtro de busca"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null}

                    {statusFilter !== 'all' ? (
                      <Badge variant="success" className="gap-1 pr-1 font-normal">
                        Status: {statusFilter}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-transparent"
                          onClick={() => onStatusChange('all')}
                          aria-label="Remover filtro de status"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null}

                    {dateFromFilter || dateToFilter ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 border border-border pr-1 font-normal"
                      >
                        Data
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-transparent"
                          onClick={() => {
                            onDateFromChange('')
                            onDateToChange('')
                          }}
                          aria-label="Remover filtro de data"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

VehicleFilters.displayName = 'VehicleFilters' 