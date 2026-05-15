"use client"

import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const STORAGE_SENT = "mgrc_access_geo_sent"
const STORAGE_DISMISSED = "mgrc_access_geo_dismissed"

function accessClientGeoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ACCESS_CLIENT_GEO !== "false"
}

async function postCoords(latitude: number, longitude: number, accuracy: number | null) {
  await fetch("/api/access/client-geo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      latitude,
      longitude,
      ...(accuracy != null && Number.isFinite(accuracy) ? { accuracy } : {}),
    }),
  })
}

function readAndSendPosition(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalização indisponível"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        void postCoords(latitude, longitude, accuracy).then(() => resolve()).catch(reject)
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )
  })
}






export function AccessGeoTelemetry() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorHint, setErrorHint] = useState<string | null>(null)

  const finishOk = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_SENT, "1")
    } catch {

    }
    setVisible(false)
    setErrorHint(null)
    router.refresh()
  }, [router])

  const onUserRequestGeo = useCallback(() => {
    setBusy(true)
    setErrorHint(null)
    void readAndSendPosition()
      .then(finishOk)
      .catch(() => {
        setErrorHint("Não foi possível obter a localização. Verifique permissões e GPS.")
      })
      .finally(() => setBusy(false))
  }, [finishOk])

  useEffect(() => {
    if (!accessClientGeoEnabled()) {
      return
    }
    if (typeof window === "undefined") {
      return
    }
    try {
      if (sessionStorage.getItem(STORAGE_SENT) === "1") {
        return
      }
      if (sessionStorage.getItem(STORAGE_DISMISSED) === "1") {
        return
      }
    } catch {

    }

    if (!navigator.geolocation) {
      return
    }

    const perm = navigator.permissions
    if (!perm?.query) {
      setVisible(true)
      return
    }

    void perm
      .query({ name: "geolocation" })
      .then((status) => {
        if (status.state === "granted") {
          setBusy(true)
          void readAndSendPosition()
            .then(finishOk)
            .catch(() => setVisible(true))
            .finally(() => setBusy(false))
          return
        }
        setVisible(true)
      })
      .catch(() => {
        setVisible(true)
      })
  }, [finishOk])

  if (!accessClientGeoEnabled() || !visible) {
    return null
  }

  return (
    <div
      role="region"
      aria-label="Permissão de localização"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-lg backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Para registro de acesso seguro, permita a localização deste dispositivo. O navegador
          exibirá a solicitação oficial de permissão.
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            className="gap-2"
            onClick={onUserRequestGeo}
          >
            <MapPin className="size-4" aria-hidden />
            {busy ? "Aguardando…" : "Permitir localização"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => {
              try {
                sessionStorage.setItem(STORAGE_DISMISSED, "1")
              } catch {

              }
              setVisible(false)
            }}
          >
            Agora não
          </Button>
        </div>
      </div>
      {errorHint ? (
        <p className="mx-auto mt-2 max-w-lg text-center text-xs text-destructive">{errorHint}</p>
      ) : null}
    </div>
  )
}
