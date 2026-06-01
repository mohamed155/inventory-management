import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubElectronAPI } from '../../setup/electron-api.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('purchases service', () => {
  it('getAllPurchasesPaginated delegates to electronAPI', async () => {
    const mock = stubElectronAPI()
    const { getAllPurchasesPaginated } = await import(
      '../../../src/services/purchases.ts'
    )
    const params = { page: 1, filter: {} } as any
    await getAllPurchasesPaginated(params)
    expect(mock.getAllPurchasesPaginated).toHaveBeenCalledWith(params)
  })

  it('getAllPurchases delegates to electronAPI', async () => {
    const mock = stubElectronAPI()
    const { getAllPurchases } = await import('../../../src/services/purchases.ts')
    await getAllPurchases()
    expect(mock.getAllPurchases).toHaveBeenCalledOnce()
  })

  it('getPurchaseById delegates with the id', async () => {
    const mock = stubElectronAPI()
    const { getPurchaseById } = await import('../../../src/services/purchases.ts')
    await getPurchaseById('pur-1')
    expect(mock.getPurchaseById).toHaveBeenCalledWith('pur-1')
  })

  it('createPurchase delegates with PurchaseFormData', async () => {
    const mock = stubElectronAPI()
    const { createPurchase } = await import('../../../src/services/purchases.ts')
    const formData = {
      userId: 'u1',
      providerId: 'p1',
      paidAmount: 100,
      products: [],
    } as any
    await createPurchase(formData)
    expect(mock.createPurchase).toHaveBeenCalledWith(formData)
  })

  it('updatePurchase delegates with id and partial data', async () => {
    const mock = stubElectronAPI()
    const { updatePurchase } = await import('../../../src/services/purchases.ts')
    const partial = { paidAmount: 200 } as any
    await updatePurchase('pur-id', partial)
    expect(mock.updatePurchase).toHaveBeenCalledWith('pur-id', partial)
  })

  it('deletePurchase delegates with the id', async () => {
    const mock = stubElectronAPI()
    const { deletePurchase } = await import('../../../src/services/purchases.ts')
    await deletePurchase('pur-del')
    expect(mock.deletePurchase).toHaveBeenCalledWith('pur-del')
  })

  it('getAllPurchaseItems delegates with purchaseId', async () => {
    const mock = stubElectronAPI()
    const { getAllPurchaseItems } = await import(
      '../../../src/services/purchases.ts'
    )
    await getAllPurchaseItems('pur-items')
    expect(mock.getAllPurchaseItems).toHaveBeenCalledWith('pur-items')
  })
})
