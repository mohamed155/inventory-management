import { beforeEach, describe, expect, it } from 'vitest'
import { useCurrentSettings } from '@/store/settings.store.ts'

const defaults = {
  primaryColor: 'violet' as const,
  currency: 'EGP' as const,
  dateFormat: 'dd/MM/yyyy' as const,
  expiryWarningDays: 10,
  lowStockThreshold: 10,
}

beforeEach(() => {
  useCurrentSettings.setState(defaults)
})

describe('settings store', () => {
  it('starts with default values', () => {
    const state = useCurrentSettings.getState()
    expect(state.primaryColor).toBe('violet')
    expect(state.currency).toBe('EGP')
    expect(state.dateFormat).toBe('dd/MM/yyyy')
    expect(state.expiryWarningDays).toBe(10)
    expect(state.lowStockThreshold).toBe(10)
  })

  it('setPrimaryColor updates the color', () => {
    useCurrentSettings.getState().setPrimaryColor('blue')
    expect(useCurrentSettings.getState().primaryColor).toBe('blue')
  })

  it('setCurrency updates the currency', () => {
    useCurrentSettings.getState().setCurrency('USD')
    expect(useCurrentSettings.getState().currency).toBe('USD')
  })

  it('setDateFormat updates the format pattern', () => {
    useCurrentSettings.getState().setDateFormat('MM/dd/yyyy')
    expect(useCurrentSettings.getState().dateFormat).toBe('MM/dd/yyyy')
  })

  it('setExpiryWarningDays updates the days value', () => {
    useCurrentSettings.getState().setExpiryWarningDays(30)
    expect(useCurrentSettings.getState().expiryWarningDays).toBe(30)
  })

  it('setLowStockThreshold updates the threshold', () => {
    useCurrentSettings.getState().setLowStockThreshold(5)
    expect(useCurrentSettings.getState().lowStockThreshold).toBe(5)
  })

  it('resetSettings reverts all values to defaults', () => {
    const { setPrimaryColor, setCurrency, setDateFormat, resetSettings } =
      useCurrentSettings.getState()
    setPrimaryColor('red')
    setCurrency('EUR')
    setDateFormat('yyyy-MM-dd')

    resetSettings()

    const state = useCurrentSettings.getState()
    expect(state.primaryColor).toBe('violet')
    expect(state.currency).toBe('EGP')
    expect(state.dateFormat).toBe('dd/MM/yyyy')
  })
})
