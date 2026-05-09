jest.mock('firebase-functions/v2/https', () => ({
  onCall: (handler) => handler,
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}));

const mockServerTimestamp = jest.fn(() => 'mock-server-timestamp');
const mockDocSet = jest.fn().mockResolvedValue(undefined);
const mockCollectionRef = jest.fn().mockReturnValue({
  doc: jest.fn().mockReturnValue({
    set: mockDocSet,
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({}),
    }),
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: mockDocSet,
      }),
    }),
  }),
});

const mockDb = {
  collection: mockCollectionRef,
};

const mockAuthCreateUser = jest
  .fn()
  .mockResolvedValue({ uid: 'mock-admin-uid-123' });
const mockAuthInstance = {
  createUser: mockAuthCreateUser,
};

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => mockDb),
  FieldValue: {
    serverTimestamp: mockServerTimestamp,
  },
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => mockAuthInstance),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-vendor-id-123'),
}));

jest.mock('../../../core/user', () => ({
  getUserByEmailSafe: jest.fn(),
}));

const { HttpsError } = require('firebase-functions/v2/https');
const { createCarrier } = require('../createCarrier');
const { getUserByEmailSafe } = require('../../../core/user');

describe('createCarrier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthCreateUser.mockResolvedValue({ uid: 'mock-admin-uid-123' });
    getUserByEmailSafe.mockResolvedValue(null);
  });

  test('throws unauthenticated when request.auth is missing', async () => {
    const request = {
      auth: null,
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@example.com',
        adminFirstName: 'John',
      },
    };

    await expect(createCarrier(request)).rejects.toThrow(HttpsError);
    await expect(createCarrier(request)).rejects.toThrow(
      expect.objectContaining({ code: 'unauthenticated' }),
    );
  });

  test('throws invalid-argument when companyName is missing', async () => {
    const request = {
      auth: { uid: 'caller-uid' },
      data: {
        adminEmail: 'admin@example.com',
        adminFirstName: 'John',
      },
    };

    await expect(createCarrier(request)).rejects.toThrow(HttpsError);
    await expect(createCarrier(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  test('throws invalid-argument when adminEmail is missing', async () => {
    const request = {
      auth: { uid: 'caller-uid' },
      data: {
        companyName: 'Test Carrier',
        adminFirstName: 'John',
      },
    };

    await expect(createCarrier(request)).rejects.toThrow(HttpsError);
    await expect(createCarrier(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  test('throws invalid-argument when adminFirstName is missing', async () => {
    const request = {
      auth: { uid: 'caller-uid' },
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@example.com',
      },
    };

    await expect(createCarrier(request)).rejects.toThrow(HttpsError);
    await expect(createCarrier(request)).rejects.toThrow(
      expect.objectContaining({ code: 'invalid-argument' }),
    );
  });

  test('reuses existing user if email already exists (idempotency)', async () => {
    const existingUser = { uid: 'existing-uid', email: 'admin@example.com' };
    getUserByEmailSafe.mockResolvedValue(existingUser);

    const request = {
      auth: { uid: 'caller-uid' },
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@example.com',
        adminFirstName: 'John',
        adminLastName: 'Doe',
      },
    };

    const result = await createCarrier(request);

    expect(result.success).toBe(true);
    expect(result.vendorID).toBe('test-vendor-id-123');
    expect(result.adminUID).toBe('existing-uid');
    expect(mockAuthCreateUser).not.toHaveBeenCalled();
  });

  test('successfully creates carrier with new admin user', async () => {
    getUserByEmailSafe.mockResolvedValue(null);

    const request = {
      auth: { uid: 'caller-uid' },
      data: {
        companyName: 'Test Carrier Inc',
        adminEmail: 'admin@example.com',
        adminFirstName: 'John',
        adminLastName: 'Doe',
      },
    };

    const result = await createCarrier(request);

    expect(result.success).toBe(true);
    expect(result.vendorID).toBe('test-vendor-id-123');
    expect(result.adminUID).toBe('mock-admin-uid-123');

    expect(mockAuthCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        displayName: 'John Doe',
      }),
    );

    expect(mockDocSet).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorID: 'test-vendor-id-123',
        name: 'Test Carrier Inc',
        searchKeywords: ['test carrier inc'],
        serviceCategoryIDs: [],
        status: 'active',
        createdBy: 'caller-uid',
      }),
    );
  });

  test('writes to both users and vendor_users collections with merge:true', async () => {
    getUserByEmailSafe.mockResolvedValue(null);

    const request = {
      auth: { uid: 'caller-uid' },
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@example.com',
        adminFirstName: 'John',
        adminLastName: 'Doe',
      },
    };

    await createCarrier(request);

    expect(mockDocSet).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mock-admin-uid-123',
        email: 'admin@example.com',
        firstName: 'John',
        lastName: 'Doe',
        vendorID: 'test-vendor-id-123',
        role: 'carrier',
        rolesArray: ['carrier'],
      }),
      { merge: true },
    );
  });
});
