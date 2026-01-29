import type { ElectronApi } from '../../../preload/api'

declare global {
  interface Window {
    api: ElectronApi
  }
}
