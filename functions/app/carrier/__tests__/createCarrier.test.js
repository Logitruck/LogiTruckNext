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
const mockCollectionDoc = jest.fn().mockReturnValue({
  set: mockDocSet,
});
const mockSubCollection = jest.fn().mockReturnValue({
  doc: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: mockDocSet,
      }),
    }),
    set: mockDocSet,
  }),
});
const mockDb = {
  collection: jest.fn().mockImplementation((name) => {
    if (name === 'vendors') {
      return {
        doc: jest.fn().mockReturnValue({
          set: mockDocSet,
        }),
      };
    }
    if (name === 'users') {
      return {
        doc: jest.fn().mockReturnValue({
          set: mockDocSet,
        }),
      };
    }
    if (name === 'vendor_users') {
      return {
        doc: jest.fn().mockReturnValue({
          collection: mockSubCollection,
        }),
      };
    }
    return { doc: jest.fn() };
  }),
};

const mockFirestore = jest.fn(() => mockDb);
mockFirestore.FieldValue = {
  serverTimestamp: mockServerTimestamp,
};

const mockAuthCreateUser = jest.fn();
const mockAuth = jest.fn(() => ({
  createUser: mockAuthCreateUser,
}));

jest.mock('firebase-admin', () => ({
  firestore: mockFirestore,
  auth: mockAuth,
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-vendor-id-123'),
}));

const mockGetUserByEmailSafe = jest.fn();
jest.mock('../../../core/user', () => ({
  getUserByEmailSafe: mockGetUserByEmailSafe,
}));

const { HttpsError } = require('firebase-functions/v2/https');
const { createCarrier } = require('../createCarrier');
const admin = require('firebase-admin');

describe('createCarrier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore.mockClear();
    mockAuth.mockClear();
  });

  test('should throw HttpsError(unauthenticated) when request.auth is null', async () => {
    const request = {
      auth: null,
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@carrier.com',
        adminFirstName: 'John',
      },
    };

    await expect(createCarrier(request)).rejects.toThrow(
      expect.objectContaining({
        code: 'unauthenticated',
      })
    );
  });

  test('should throw HttpsError(invalid-argument) when companyName is missing', async () => {
    const request = {
      auth: { uid: 'user-123' },
      data: {
        adminEmail: 'admin@carrier.com',
        adminFirstName: 'John',
      },
    };

    await expect(createCarrier(request)).rejects.toThrow(
      expect.objectContaining({
        code: 'invalid-argument',
        message: expect.stringContaining('companyName'),
      })
    );
  });

  test('should throw HttpsError(invalid-argument) when adminEmail is missing', async () => {
    const request = {
      auth: { uid: 'user-123' },
      data: {
        companyName: 'Test Carrier',
        adminFirstName: 'John',
      },
    };

    await expect(createCarrier(request)).rejects.toThrow(
      expect.objectContaining({
        code: 'invalid-argument',
        message: expect.stringContaining('adminEmail'),
      })
    );
  });

  test('should throw HttpsError(invalid-argument) when adminFirstName is missing', async () => {
    const request = {
      auth: { uid: 'user-123' },
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@carrier.com',
      },
    };

    await expect(createCarrier(request)).rejects.toThrow(
      expect.objectContaining({
        code: 'invalid-argument',
        message: expect.stringContaining('adminFirstName'),
      })
    );
  });

  test('should reuse existing Firebase Auth user if email already exists (idempotency)', async () => {
    const existingUser = { uid: 'existing-uid-456' };
    mockGetUserByEmailSafe.mockResolvedValue(existingUser);

    const request = {
      auth: { uid: 'user-123' },
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@carrier.com',
        adminFirstName: 'John',
        adminLastName: 'Doe',
      },
    };

    const result = await createCarrier(request);

    expect(result.success).toBe(true);
    expect(result.adminUID).toBe('existing-uid-456');
    expect(result.vendorID).toBe('test-vendor-id-123');
    expect(mockAuthCreateUser).not.toHaveBeenCalled();
    expect(mockGetUserByEmailSafe).toHaveBeenCalledWith('admin@carrier.com');
  });

  test('should create new Firebase Auth user if email does not exist', async () => {
    mockGetUserByEmailSafe.mockResolvedValue(null);
    mockAuthCreateUser.mockResolvedValue({ uid: 'new-uid-789' });

    const request = {
      auth: { uid: 'user-123' },
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@carrier.com',
        adminFirstName: 'John',
        adminLastName: 'Doe',
      },
    };

    const result = await createCarrier(request);

    expect(result.success).toBe(true);
    expect(result.adminUID).toBe('new-uid-789');
    expect(mockAuthCreateUser).toHaveBeenCalledWith({
      email: 'admin@carrier.com',
      displayName: 'John Doe',
    });
  });

  test('should successfully create carrier with all required Firestore writes', async () => {
    mockGetUserByEmailSafe.mockResolvedValue(null);
    mockAuthCreateUser.mockResolvedValue({ uid: 'new-uid-789' });

    const request = {
      auth: { uid: 'user-123' },
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@carrier.com',
        adminFirstName: 'John',
        adminLastName: 'Doe',
      },
    };

    const result = await createCarrier(request);

    expect(result.success).toBe(true);
    expect(result.vendorID).toBe('test-vendor-id-123');
    expect(result.adminUID).toBe('new-uid-789');

    // Verify vendors/{vendorID} write
    expect(mockDb.collection).toHaveBeenCalledWith('vendors');
    expect(mockDocSet).toHaveBeenCalled();

    // Verify users/{uid} write
    expect(mockDb.collection).toHaveBeenCalledWith('users');

    // Verify vendor_users/{vendorID}/users/{uid} write
    expect(mockDb.collection).toHaveBeenCalledWith('vendor_users');

    // Verify serverTimestamp was called
    expect(mockServerTimestamp).toHaveBeenCalled();
  });

  test('should use adminFirstName only when adminLastName is missing', async () => {
    mockGetUserByEmailSafe.mockResolvedValue(null);
    mockAuthCreateUser.mockResolvedValue({ uid: 'new-uid-789' });

    const request = {
      auth: { uid: 'user-123' },
      data: {
        companyName: 'Test Carrier',
        adminEmail: 'admin@carrier.com',
        adminFirstName: 'John',
      },
    };

    await createCarrier(request);

    expect(mockAuthCreateUser).toHaveBeenCalledWith({
      email: 'admin@carrier.com',
      displayName: 'John',
    });
  });
});
