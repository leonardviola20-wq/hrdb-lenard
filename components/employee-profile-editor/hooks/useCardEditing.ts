"use client";

import { useCallback, useState } from "react";
import type { EditorForm } from "../types";

/** Per-card edit mode (update flow only). One card is edited at a time. */
export function useCardEditing(
  employeeId: number | null,
  setForm: React.Dispatch<React.SetStateAction<EditorForm>>,
  submit: (redirectToResult?: boolean) => Promise<"redirected" | "saved" | "failed">,
  setError: (value: string) => void,
) {
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState<string | null>(null);
  /** Values captured when a card's edit was started, so Cancel can undo field changes. */
  const [cardBackup, setCardBackup] = useState<Partial<EditorForm> | null>(null);
  const [cardNotice, setCardNotice] = useState("");

  const startCardEdit = useCallback((cardKey: string, fields: (keyof EditorForm)[]) => {
    setForm((current) => {
      const backup: Partial<EditorForm> = {};
      for (const field of fields) backup[field] = current[field];
      setCardBackup(backup);
      return current;
    });
    setEditingCard(cardKey);
    setCardNotice("");
  }, [setForm]);

  const cancelCardEdit = useCallback(() => {
    if (cardBackup) setForm((current) => ({ ...current, ...cardBackup }));
    setCardBackup(null);
    setEditingCard(null);
    setError("");
  }, [cardBackup, setError, setForm]);

  const saveCard = useCallback(async (cardKey: string) => {
    if (employeeId === null) return;
    setSavingCard(cardKey);
    setError("");
    const result = await submit(false);
    setSavingCard(null);
    if (result === "saved" || result === "redirected") {
      setCardBackup(null);
      setEditingCard(null);
      setCardNotice("Changes saved.");
    }
  }, [employeeId, setError, submit]);

  return { editingCard, savingCard, cardNotice, startCardEdit, cancelCardEdit, saveCard };
}
