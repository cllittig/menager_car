import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle } from "lucide-react"

interface ValidatedInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  step?: string
  validation?: { isValid: boolean; message?: string }
  formatValue?: (value: string) => string
  required?: boolean
  className?: string
  maxLength?: number
}

export function ValidatedInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  validation,
  formatValue,
  required = false,
  className,
  maxLength
}: ValidatedInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const formattedValue = formatValue ? formatValue(newValue) : newValue
    onChange(formattedValue)
  }

  const hasError = validation && !validation.isValid && validation.message
  const hasSuccess = validation && validation.isValid && value.length > 0

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          step={step}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "pr-10",
            hasError && "border-destructive focus-visible:ring-destructive/40",
            hasSuccess && "border-success focus-visible:ring-success/35"
          )}
        />
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
        )}
        {hasSuccess && (
          <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--success))]" />
        )}
      </div>
      {hasError && (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-3 w-3" />
          {validation.message}
        </p>
      )}
    </div>
  )
} 