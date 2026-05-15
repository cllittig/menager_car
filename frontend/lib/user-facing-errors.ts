


export function extractApiMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const m = (data as { message?: string | string[] }).message;
  if (Array.isArray(m)) return m.filter(Boolean).join(" ");
  if (typeof m === "string" && m.trim().length > 0) return m.trim();
  return "";
}

type Translate = (key: string) => string;


export function loginFailureToast(
  statusCode: number,
  backendMessage: string | undefined,
  t: Translate,
): { title: string; description: string } {
  if (statusCode === 401) {
    return {
      title: t("login.toastWrongLoginTitle"),
      description: t("login.toastWrongLoginDescription"),
    };
  }
  if (statusCode === 429) {
    const raw = backendMessage?.trim() ?? "";
    return {
      title: t("login.toastRateLimitTitle"),
      description:
        raw.length > 0 && raw.length < 220 ? raw : t("login.toastRateLimitDescription"),
    };
  }
  if (statusCode >= 500) {
    return {
      title: t("login.toastUnavailableTitle"),
      description: t("login.toastUnavailableDescription"),
    };
  }
  return {
    title: t("login.toastGenericFailTitle"),
    description: backendMessage?.trim() || t("login.invalidCredentials"),
  };
}


export function registerFailureToast(
  statusCode: number,
  backendMessage: string | undefined,
  t: Translate,
): { title: string; description: string } {
  if (statusCode === 429) {
    const raw = backendMessage?.trim() ?? "";
    return {
      title: t("register.toastRateLimitTitle"),
      description:
        raw.length > 0 && raw.length < 220 ? raw : t("register.toastRateLimitDescription"),
    };
  }
  if (statusCode >= 500) {
    return {
      title: t("register.toastUnavailableTitle"),
      description: t("register.toastUnavailableDescription"),
    };
  }
  return {
    title: t("register.toastSignupFailedTitle"),
    description: backendMessage?.trim() || t("register.registerError"),
  };
}
