"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export type ConfirmDestructiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void | Promise<void>
  isPending?: boolean
  confirmLabel?: string
  cancelLabel?: string
  pendingLabel?: string
}

export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending = false,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  pendingLabel = "Excluindo…",
}: ConfirmDestructiveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => void onConfirm()}
          >
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
