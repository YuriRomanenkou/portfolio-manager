import { create } from 'zustand'

interface UiState {
  addAssetDialogOpen: boolean
  editAssetDialogOpen: boolean
  editAssetId: number | null
  addTransactionDialogOpen: boolean
  addTransactionAssetId: number | null
  sidebarCollapsed: boolean

  openAddAssetDialog: () => void
  closeAddAssetDialog: () => void
  openEditAssetDialog: (id: number) => void
  closeEditAssetDialog: () => void
  openAddTransactionDialog: (assetId: number) => void
  closeAddTransactionDialog: () => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>((set) => ({
  addAssetDialogOpen: false,
  editAssetDialogOpen: false,
  editAssetId: null,
  addTransactionDialogOpen: false,
  addTransactionAssetId: null,
  sidebarCollapsed: false,

  openAddAssetDialog: () => set({ addAssetDialogOpen: true }),
  closeAddAssetDialog: () => set({ addAssetDialogOpen: false }),
  openEditAssetDialog: (id) => set({ editAssetDialogOpen: true, editAssetId: id }),
  closeEditAssetDialog: () => set({ editAssetDialogOpen: false, editAssetId: null }),
  openAddTransactionDialog: (assetId) =>
    set({ addTransactionDialogOpen: true, addTransactionAssetId: assetId }),
  closeAddTransactionDialog: () =>
    set({ addTransactionDialogOpen: false, addTransactionAssetId: null }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
}))
