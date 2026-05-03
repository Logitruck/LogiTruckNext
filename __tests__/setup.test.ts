describe('Jest environment', () => {
  it('is configured correctly', () => {
    expect(true).toBe(true)
  })

  it('async/await works', async () => {
    const result = await Promise.resolve(42)
    expect(result).toBe(42)
  })

  it('jest.fn() mocks work', () => {
    const mock = jest.fn(() => 'mocked')
    expect(mock()).toBe('mocked')
    expect(mock).toHaveBeenCalledTimes(1)
  })
})
