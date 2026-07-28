/**
 * Contexte de consultation d'une usine par un SUPERADMIN.
 *
 * Quand le SUPERADMIN clique sur "Voir le dashboard" depuis la fiche d'une
 * usine, on mémorise l'usine consultée pour la durée de l'onglet
 * (sessionStorage). L'intercepteur Axios (voir api.ts) ajoute alors l'en-tête
 * X-Usine-Context à chaque requête, ce qui permet au backend de renvoyer les
 * données de cette usine exactement comme le ferait son propre administrateur.
 */

const STORAGE_KEY = "smartmaint:impersonatedUsine";

export interface ImpersonatedUsine {
  id: number;
  name: string;
}

export function getImpersonatedUsine(): ImpersonatedUsine | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ImpersonatedUsine;

    if (typeof parsed?.id === "number" && typeof parsed?.name === "string") {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

export function setImpersonatedUsine(usine: ImpersonatedUsine): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usine));
}

export function clearImpersonatedUsine(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isImpersonating(): boolean {
  return getImpersonatedUsine() !== null;
}
