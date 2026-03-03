import { NAVService, INAVStorageAdapter, ProtocolState } from '../nav.service';

describe('NAVService', () => {
    let mockStorage: jest.Mocked<INAVStorageAdapter>;
    let navService: NAVService;

    beforeEach(() => {
        mockStorage = {
            getLiveProtocolState: jest.fn(),
            saveSnapshot: jest.fn(),
            logAction: jest.fn(),
            getLatestSnapshot: jest.fn(),
        };
        navService = new NAVService(mockStorage);
    });

    describe('calculateAndSnapshotNAV()', () => {
        it('should fetch live state, calculate NAV, save snapshot, and log action', async () => {
            mockStorage.getLiveProtocolState.mockResolvedValue({
                treasury: '150000',
                supply: 1000,
            });

            mockStorage.getLatestSnapshot.mockResolvedValue({
                nav: '140.00000000',
                treasury: '140000.00000000',
                supply: 1000,
                minPrice: '98.00000000',
                maxPrice: '140.00000000',
                updatedAt: new Date().toISOString()
            });

            const nav = await navService.calculateAndSnapshotNAV(1, 'corr-123');

            expect(nav).toBe('150.00000000'); // 150000 / 1000

            expect(mockStorage.getLiveProtocolState).toHaveBeenCalledWith(1);

            expect(mockStorage.saveSnapshot).toHaveBeenCalledWith(
                1,
                '150.00000000',
                '150000.00000000',
                1000
            );

            expect(mockStorage.logAction).toHaveBeenCalledWith(
                'corr-123',
                'NAV_SNAPSHOT_GENERATED',
                1,
                expect.objectContaining({
                    previousNAV: '140.00000000',
                    newNAV: '150.00000000',
                    treasury: '150000.00000000',
                    supply: 1000,
                })
            );
        });

        it('should handle missing previous snapshots correctly for logging', async () => {
            mockStorage.getLiveProtocolState.mockResolvedValue({
                treasury: '20000',
                supply: 500,
            });

            mockStorage.getLatestSnapshot.mockResolvedValue(null); // No previous snapshot

            const nav = await navService.calculateAndSnapshotNAV(2, 'corr-456');

            expect(nav).toBe('40.00000000');
            expect(mockStorage.logAction).toHaveBeenCalledWith(
                'corr-456',
                'NAV_SNAPSHOT_GENERATED',
                2,
                expect.objectContaining({
                    previousNAV: '0',
                    newNAV: '40.00000000',
                })
            );
        });
    });

    describe('getLatestPersistedNAV()', () => {
        it('should return the latest snapshot from storage', async () => {
            const mockSnapshot = {
                nav: '100.00',
                treasury: '10000.00',
                supply: 100,
                minPrice: '70.00',
                maxPrice: '100.00',
                updatedAt: new Date().toISOString()
            };

            mockStorage.getLatestSnapshot.mockResolvedValue(mockSnapshot);

            const result = await navService.getLatestPersistedNAV(1);
            expect(result).toEqual(mockSnapshot);
        });

        it('should throw an error if no snapshot exists', async () => {
            mockStorage.getLatestSnapshot.mockResolvedValue(null);
            await expect(navService.getLatestPersistedNAV(1)).rejects.toThrow('No NAV snapshot found for protocol 1');
        });
    });
});
