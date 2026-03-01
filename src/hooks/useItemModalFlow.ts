import { useState, useCallback } from 'react';
import { useModalBackHandler } from './useModalBackHandler';

/**
 * Generic hook for View→Edit modal navigation flow.
 * Manages: viewing, editing, cameFromView, unsaved changes dialog.
 * Consumer provides `hasFormChanges` to detect dirty state.
 */
interface UseItemModalFlowOptions<T> {
  /** Called when transitioning to edit — consumer should populate form state */
  onOpenEdit?: (item: T | null) => void;
}

interface UseItemModalFlowReturn<T> {
  // State
  isEditOpen: boolean;
  editingItem: T | null;
  viewingItem: T | null;
  showUnsavedDialog: boolean;

  // Actions
  openView: (item: T) => void;
  closeView: () => void;
  openEdit: (item?: T) => void;
  openEditFromView: (item: T) => void;
  closeEdit: (hasFormChanges: boolean) => void;
  discardAndBack: () => void;
  confirmSaveAndBack: (savedItem: T) => void;
  afterSubmit: (savedItem: T) => void;
  dismissUnsavedDialog: () => void;
}

export function useItemModalFlow<T extends { id: string }>(
  options?: UseItemModalFlowOptions<T>
): UseItemModalFlowReturn<T> {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [viewingItem, setViewingItem] = useState<T | null>(null);
  const [cameFromView, setCameFromView] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const openView = useCallback((item: T) => setViewingItem(item), []);
  const closeView = useCallback(() => setViewingItem(null), []);

  const openEdit = useCallback((item?: T) => {
    setEditingItem(item ?? null);
    options?.onOpenEdit?.(item ?? null);
    setIsEditOpen(true);
  }, [options]);

  const openEditFromView = useCallback((item: T) => {
    setCameFromView(true);
    setViewingItem(null);
    setEditingItem(item);
    options?.onOpenEdit?.(item);
    setIsEditOpen(true);
  }, [options]);

  const closeEdit = useCallback((hasFormChanges: boolean) => {
    if (cameFromView && editingItem) {
      if (hasFormChanges) {
        setShowUnsavedDialog(true);
        return;
      }
      setIsEditOpen(false);
      setCameFromView(false);
      setViewingItem(editingItem);
    } else {
      setIsEditOpen(false);
      setCameFromView(false);
    }
  }, [cameFromView, editingItem]);

  const discardAndBack = useCallback(() => {
    setShowUnsavedDialog(false);
    setIsEditOpen(false);
    const item = editingItem;
    setCameFromView(false);
    if (item) setViewingItem(item);
  }, [editingItem]);

  const confirmSaveAndBack = useCallback((savedItem: T) => {
    setShowUnsavedDialog(false);
    setIsEditOpen(false);
    setCameFromView(false);
    setViewingItem(savedItem);
  }, []);

  const afterSubmit = useCallback((savedItem: T) => {
    setIsEditOpen(false);
    if (cameFromView) {
      setCameFromView(false);
      setViewingItem(savedItem);
    }
  }, [cameFromView]);

  const dismissUnsavedDialog = useCallback(() => setShowUnsavedDialog(false), []);

  // Back gesture handlers
  useModalBackHandler(!!viewingItem, closeView);
  useModalBackHandler(isEditOpen, () => {
    // This will be called on back gesture — we need hasFormChanges from consumer
    // For safety, just close (consumer wraps closeEdit with their hasFormChanges check)
    if (cameFromView && editingItem) {
      // Back from edit-from-view → return to view without checking (consumer handles via closeEdit)
      setIsEditOpen(false);
      setCameFromView(false);
      setViewingItem(editingItem);
    } else {
      setIsEditOpen(false);
      setCameFromView(false);
    }
  });

  return {
    isEditOpen,
    editingItem,
    viewingItem,
    showUnsavedDialog,
    openView,
    closeView,
    openEdit,
    openEditFromView,
    closeEdit,
    discardAndBack,
    confirmSaveAndBack,
    afterSubmit,
    dismissUnsavedDialog,
  };
}

