import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubElectronAPI } from '../../setup/electron-api.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('customers service', () => {
  it('getAllCustomersPaginated delegates to electronAPI', async () => {
    const mock = stubElectronAPI()
    const { getAllCustomersPaginated } = await import(
      '../../../src/services/customers.ts'
    )
    const params = { page: 1, filter: [] } as any
    await getAllCustomersPaginated(params)
    expect(mock.getAllCustomersPaginated).toHaveBeenCalledWith(params)
  })

  it('getAllCustomers delegates to electronAPI', async () => {
    const mock = stubElectronAPI()
    const { getAllCustomers } = await import('../../../src/services/customers.ts')
    await getAllCustomers()
    expect(mock.getAllCustomers).toHaveBeenCalledOnce()
  })

  it('getCustomerById delegates with correct id', async () => {
    const mock = stubElectronAPI()
    const { getCustomerById } = await import('../../../src/services/customers.ts')
    await getCustomerById('cust-123')
    expect(mock.getCustomerById).toHaveBeenCalledWith('cust-123')
  })

  it('createCustomer delegates with the customer data', async () => {
    const mock = stubElectronAPI()
    const { createCustomer } = await import('../../../src/services/customers.ts')
    const payload = { firstname: 'Test', phone: '010' } as any
    await createCustomer(payload)
    expect(mock.createCustomer).toHaveBeenCalledWith(payload)
  })

  it('updateCustomer delegates with id and customer data', async () => {
    const mock = stubElectronAPI()
    const { updateCustomer } = await import('../../../src/services/customers.ts')
    const payload = { firstname: 'Updated' } as any
    await updateCustomer('id-1', payload)
    expect(mock.updateCustomer).toHaveBeenCalledWith('id-1', payload)
  })

  it('deleteCustomer delegates with the id', async () => {
    const mock = stubElectronAPI()
    const { deleteCustomer } = await import('../../../src/services/customers.ts')
    await deleteCustomer('id-del')
    expect(mock.deleteCustomer).toHaveBeenCalledWith('id-del')
  })
})
