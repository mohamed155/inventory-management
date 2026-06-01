import { beforeEach, describe, expect, it } from 'vitest'
import { useCurrentLang } from '../../../src/store/lang.store.ts'

beforeEach(() => {
  useCurrentLang.setState({ lang: 'en' })
})

describe('lang store', () => {
  it('starts with English as the default language', () => {
    expect(useCurrentLang.getState().lang).toBe('en')
  })

  it('setLang updates the language to Arabic', () => {
    useCurrentLang.getState().setLang('ar')
    expect(useCurrentLang.getState().lang).toBe('ar')
  })

  it('setLang switches back to English from Arabic', () => {
    useCurrentLang.getState().setLang('ar')
    useCurrentLang.getState().setLang('en')
    expect(useCurrentLang.getState().lang).toBe('en')
  })
})
