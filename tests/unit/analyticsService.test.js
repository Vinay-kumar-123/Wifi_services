/**
 * Unit tests for analytics service — tests pure computation logic.
 * Firebase SDK is mocked in tests/setup.js.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';

import { getAdminAnalyticsData } from '@/services/analytics/analyticsService';

const makeMockComplaint = (overrides = {}) => ({
  id: 'c-001',
  status: 'open',
  priority: 'medium',
  category: 'Slow internet',
  customerId: 'cust-001',
  assignedTechnicianId: null,
  assignedTechnicianName: null,
  createdAt: { toDate: () => new Date('2024-01-15') },
  resolvedAt: null,
  closedAt: null,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  collection.mockReturnValue({});
  query.mockReturnValue({});
  where.mockReturnValue({});
  orderBy.mockReturnValue({});
});

describe('getAdminAnalyticsData', () => {
  it('should return zeroed KPI when no complaints exist', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] }); // complaints
    getDocs.mockResolvedValueOnce({ docs: [] }); // technicians

    const result = await getAdminAnalyticsData('30d');

    expect(result.kpi.total).toBe(0);
    expect(result.kpi.open).toBe(0);
    expect(result.kpi.critical).toBe(0);
    expect(result.kpi.avgResolutionTimeHours).toBe(0);
    expect(result.statusDistribution).toHaveLength(0);
    expect(result.priorityDistribution).toHaveLength(0);
    expect(result.categoryDistribution).toHaveLength(0);
  });

  it('should correctly count complaints by status', async () => {
    const complaints = [
      makeMockComplaint({ status: 'open' }),
      makeMockComplaint({ id: 'c-002', status: 'open' }),
      makeMockComplaint({ id: 'c-003', status: 'assigned', assignedTechnicianId: 'tech-001' }),
      makeMockComplaint({ id: 'c-004', status: 'resolved', assignedTechnicianId: 'tech-001', resolvedAt: { toDate: () => new Date('2024-01-16') } }),
    ];

    getDocs.mockResolvedValueOnce({
      docs: complaints.map(c => ({ id: c.id, data: () => c })),
    });
    getDocs.mockResolvedValueOnce({ docs: [] }); // technicians

    const result = await getAdminAnalyticsData('all');

    expect(result.kpi.total).toBe(4);
    expect(result.kpi.open).toBe(2);
    expect(result.kpi.assigned).toBe(1);
    expect(result.kpi.resolved).toBe(1);
  });

  it('should correctly count critical priority tickets (excluding closed/cancelled)', async () => {
    const complaints = [
      makeMockComplaint({ priority: 'critical', status: 'open' }),
      makeMockComplaint({ id: 'c-002', priority: 'critical', status: 'closed' }), // should NOT be counted
      makeMockComplaint({ id: 'c-003', priority: 'critical', status: 'cancelled' }), // should NOT
      makeMockComplaint({ id: 'c-004', priority: 'high', status: 'open' }),
    ];

    getDocs.mockResolvedValueOnce({
      docs: complaints.map(c => ({ id: c.id, data: () => c })),
    });
    getDocs.mockResolvedValueOnce({ docs: [] });

    const result = await getAdminAnalyticsData('all');

    expect(result.kpi.critical).toBe(1); // Only the open critical
  });

  it('should compute average resolution time correctly', async () => {
    const createdAt = { toDate: () => new Date('2024-01-01T10:00:00Z') };
    const resolvedAt = { toDate: () => new Date('2024-01-01T12:00:00Z') }; // 2 hours later

    const complaints = [
      makeMockComplaint({
        status: 'resolved',
        createdAt,
        resolvedAt,
      }),
    ];

    getDocs.mockResolvedValueOnce({
      docs: complaints.map(c => ({ id: c.id, data: () => c })),
    });
    getDocs.mockResolvedValueOnce({ docs: [] });

    const result = await getAdminAnalyticsData('all');

    expect(result.kpi.avgResolutionTimeHours).toBe(2);
  });

  it('should compute technician performance from complaint data', async () => {
    const complaints = [
      makeMockComplaint({
        status: 'in_progress',
        assignedTechnicianId: 'tech-001',
        assignedTechnicianName: 'Technician One',
      }),
      makeMockComplaint({
        id: 'c-002',
        status: 'resolved',
        assignedTechnicianId: 'tech-001',
        assignedTechnicianName: 'Technician One',
        resolvedAt: { toDate: () => new Date() },
      }),
      makeMockComplaint({
        id: 'c-003',
        status: 'resolved',
        assignedTechnicianId: 'tech-001',
        assignedTechnicianName: 'Technician One',
        resolvedAt: { toDate: () => new Date() },
      }),
    ];

    getDocs.mockResolvedValueOnce({
      docs: complaints.map(c => ({ id: c.id, data: () => c })),
    });
    getDocs.mockResolvedValueOnce({ docs: [] }); // No user doc for technician

    const result = await getAdminAnalyticsData('all');

    const techEntry = result.technicianPerformance.find(t => t.id === 'tech-001');
    expect(techEntry).toBeDefined();
    expect(techEntry.activeTickets).toBe(1);
    expect(techEntry.resolvedTickets).toBe(2);
  });

  it('should build daily trend with correct number of days for 7d timeframe', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    getDocs.mockResolvedValueOnce({ docs: [] });

    const result = await getAdminAnalyticsData('7d');

    expect(result.dailyTrend).toHaveLength(7);
    // Every entry should have date, created, resolved keys
    result.dailyTrend.forEach(day => {
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('created');
      expect(day).toHaveProperty('resolved');
    });
  });

  it('should build daily trend with 30 days for 30d timeframe', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    getDocs.mockResolvedValueOnce({ docs: [] });

    const result = await getAdminAnalyticsData('30d');

    expect(result.dailyTrend).toHaveLength(30);
  });
});
