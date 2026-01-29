import { create } from 'zustand'
import type { DisplayCurrency, RiskProfile, Settings } from '../../../shared/types'

interface SettingsState {
  displayCurrency: DisplayCurrency
  updateIntervalMinutes: number
  riskProfile: RiskProfile
  loaded: boolean

  fetchSettings: () => Promise<void>
  setDisplayCurrency: (currency: DisplayCurrency) => Promise<void>
  setUpdateInterval: (minutes: number) => Promise<void>
  setRiskProfile: (profile: RiskProfile) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  displayCurrency: 'USD',
  updateIntervalMinutes: 30,
  riskProfile: 'moderate',
  loaded: false,

  fetchSettings: async () => {
    try {
      const settings = await window.api.settings.get()
      set({
        displayCurrency: settings.display_currency,
        updateIntervalMinutes: settings.update_interval_minutes,
        riskProfile: settings.risk_profile,
        loaded: true
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  },

  setDisplayCurrency: async (currency) => {
    try {
      await window.api.settings.set({ display_currency: currency } as Partial<Settings>)
      set({ displayCurrency: currency })
    } catch (error) {
      console.error('Failed to set currency:', error)
    }
  },

  setUpdateInterval: async (minutes) => {
    try {
      await window.api.settings.set({ update_interval_minutes: minutes } as Partial<Settings>)
      set({ updateIntervalMinutes: minutes })
    } catch (error) {
      console.error('Failed to set interval:', error)
    }
  },

  setRiskProfile: async (profile) => {
    try {
      await window.api.settings.set({ risk_profile: profile } as Partial<Settings>)
      set({ riskProfile: profile })
    } catch (error) {
      console.error('Failed to set risk profile:', error)
    }
  }
}))
