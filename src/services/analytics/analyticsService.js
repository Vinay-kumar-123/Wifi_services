import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';
import { COMPLAINT_STATUS } from '@/constants/complaintStatus';
import { format, subDays, isAfter } from 'date-fns';

/**
 * Fetch complaints and compute live analytics metrics for Admin dashboard.
 * Supports filtering by timeframe: '7d', '30d', or 'all'.
 */
export const getAdminAnalyticsData = async (timeframe = '30d') => {
  // 1. Fetch complaints collection
  const complaintsRef = collection(db, 'complaints');
  const complaintsQuery = query(complaintsRef, orderBy('createdAt', 'desc'));
  const complaintsSnap = await getDocs(complaintsQuery);

  const rawComplaints = complaintsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  // 2. Fetch technicians for workload and leaderboard
  const usersRef = collection(db, 'users');
  const techQuery = query(usersRef, where('role', '==', 'technician'));
  const techSnap = await getDocs(techQuery);
  const technicians = techSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  // Determine cutoff date for timeframe filtering
  const now = new Date();
  let cutoffDate = null;
  let daysCount = 30;

  if (timeframe === '7d') {
    cutoffDate = subDays(now, 7);
    daysCount = 7;
  } else if (timeframe === '30d') {
    cutoffDate = subDays(now, 30);
    daysCount = 30;
  }

  // Filter complaints for timeframe
  const filteredComplaints = rawComplaints.filter((c) => {
    if (!cutoffDate) return true;
    if (!c.createdAt) return true;
    const createdDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
    return isAfter(createdDate, cutoffDate);
  });

  // 3. Compute KPI Summary Cards
  const kpi = {
    total: filteredComplaints.length,
    open: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    cancelled: 0,
    critical: 0,
    avgResolutionTimeHours: 0,
  };

  // Status breakdown counters
  const statusCounts = {
    [COMPLAINT_STATUS.OPEN]: 0,
    [COMPLAINT_STATUS.ASSIGNED]: 0,
    [COMPLAINT_STATUS.ACCEPTED]: 0,
    [COMPLAINT_STATUS.IN_PROGRESS]: 0,
    [COMPLAINT_STATUS.RESOLVED]: 0,
    [COMPLAINT_STATUS.CLOSED]: 0,
    [COMPLAINT_STATUS.CANCELLED]: 0,
  };

  // Priority breakdown counters
  const priorityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  // Category breakdown counters
  const categoryCounts = {};

  // Average Resolution Time Calculation
  let totalResolutionTimeMs = 0;
  let resolvedComplaintsCount = 0;

  filteredComplaints.forEach((c) => {
    // Status counts
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status] += 1;
    }

    // KPI mapping
    if (c.status === COMPLAINT_STATUS.OPEN) kpi.open += 1;
    else if (c.status === COMPLAINT_STATUS.ASSIGNED) kpi.assigned += 1;
    else if (c.status === COMPLAINT_STATUS.ACCEPTED || c.status === COMPLAINT_STATUS.IN_PROGRESS) {
      kpi.inProgress += 1;
    } else if (c.status === COMPLAINT_STATUS.RESOLVED) kpi.resolved += 1;
    else if (c.status === COMPLAINT_STATUS.CLOSED) kpi.closed += 1;
    else if (c.status === COMPLAINT_STATUS.CANCELLED) kpi.cancelled += 1;

    // Priority counts
    const prio = (c.priority || 'medium').toLowerCase();
    if (priorityCounts[prio] !== undefined) {
      priorityCounts[prio] += 1;
    }
    if (prio === 'critical' && c.status !== COMPLAINT_STATUS.CLOSED && c.status !== COMPLAINT_STATUS.CANCELLED) {
      kpi.critical += 1;
    }

    // Category counts
    const cat = c.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Resolution Time: createdAt to resolvedAt (or closedAt)
    if (c.createdAt && (c.resolvedAt || c.closedAt)) {
      const startMs = c.createdAt?.toDate ? c.createdAt.toDate().getTime() : new Date(c.createdAt).getTime();
      const endTimestamp = c.resolvedAt || c.closedAt;
      const endMs = endTimestamp?.toDate ? endTimestamp.toDate().getTime() : new Date(endTimestamp).getTime();

      if (endMs > startMs) {
        totalResolutionTimeMs += endMs - startMs;
        resolvedComplaintsCount += 1;
      }
    }
  });

  if (resolvedComplaintsCount > 0) {
    const avgMs = totalResolutionTimeMs / resolvedComplaintsCount;
    kpi.avgResolutionTimeHours = Number((avgMs / (1000 * 60 * 60)).toFixed(1));
  }

  // 4. Format Status Distribution for Recharts Pie/Donut
  const statusLabels = {
    [COMPLAINT_STATUS.OPEN]: 'Open',
    [COMPLAINT_STATUS.ASSIGNED]: 'Assigned',
    [COMPLAINT_STATUS.ACCEPTED]: 'Accepted',
    [COMPLAINT_STATUS.IN_PROGRESS]: 'In Progress',
    [COMPLAINT_STATUS.RESOLVED]: 'Resolved',
    [COMPLAINT_STATUS.CLOSED]: 'Closed',
    [COMPLAINT_STATUS.CANCELLED]: 'Cancelled',
  };

  const statusColors = {
    [COMPLAINT_STATUS.OPEN]: '#3b82f6', // blue
    [COMPLAINT_STATUS.ASSIGNED]: '#f59e0b', // amber
    [COMPLAINT_STATUS.ACCEPTED]: '#8b5cf6', // purple
    [COMPLAINT_STATUS.IN_PROGRESS]: '#06b6d4', // cyan
    [COMPLAINT_STATUS.RESOLVED]: '#10b981', // green
    [COMPLAINT_STATUS.CLOSED]: '#64748b', // slate
    [COMPLAINT_STATUS.CANCELLED]: '#ef4444', // red
  };

  const statusDistribution = Object.keys(statusCounts)
    .filter((key) => statusCounts[key] > 0)
    .map((key) => ({
      name: statusLabels[key] || key,
      value: statusCounts[key],
      color: statusColors[key] || '#94a3b8',
    }));

  // 5. Format Priority Distribution
  const priorityColors = {
    critical: '#dc2626', // dark red
    high: '#ea580c', // orange
    medium: '#f59e0b', // amber
    low: '#10b981', // green
  };

  const priorityDistribution = [
    { name: 'Critical', value: priorityCounts.critical, color: priorityColors.critical },
    { name: 'High', value: priorityCounts.high, color: priorityColors.high },
    { name: 'Medium', value: priorityCounts.medium, color: priorityColors.medium },
    { name: 'Low', value: priorityCounts.low, color: priorityColors.low },
  ].filter((p) => p.value > 0);

  // 6. Format Category Distribution (Sorted by count desc)
  const categoryDistribution = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // 7. Format Daily Incident Volume Trend
  // Generate date slots for chart
  const trendMap = {};
  const trendDays = timeframe === 'all' ? 14 : daysCount;

  for (let i = trendDays - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const key = format(d, 'MMM dd');
    trendMap[key] = {
      date: key,
      created: 0,
      resolved: 0,
    };
  }

  filteredComplaints.forEach((c) => {
    if (c.createdAt) {
      const createdDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      const key = format(createdDate, 'MMM dd');
      if (trendMap[key]) {
        trendMap[key].created += 1;
      }
    }

    if (c.resolvedAt) {
      const resolvedDate = c.resolvedAt?.toDate ? c.resolvedAt.toDate() : new Date(c.resolvedAt);
      const key = format(resolvedDate, 'MMM dd');
      if (trendMap[key]) {
        trendMap[key].resolved += 1;
      }
    }
  });

  const dailyTrend = Object.values(trendMap);

  // 8. Technician Workload and Resolution Leaderboard
  // Calculate active and resolved count per technician
  const techMap = {};

  technicians.forEach((t) => {
    techMap[t.id] = {
      id: t.id,
      name: t.displayName || t.email || 'Technician',
      activeTickets: 0,
      resolvedTickets: 0,
    };
  });

  // Also include assigned technicians even if user profile was deleted
  rawComplaints.forEach((c) => {
    if (c.assignedTechnicianId) {
      if (!techMap[c.assignedTechnicianId]) {
        techMap[c.assignedTechnicianId] = {
          id: c.assignedTechnicianId,
          name: c.assignedTechnicianName || 'Technician',
          activeTickets: 0,
          resolvedTickets: 0,
        };
      }

      const isActive = [
        COMPLAINT_STATUS.ASSIGNED,
        COMPLAINT_STATUS.ACCEPTED,
        COMPLAINT_STATUS.IN_PROGRESS,
      ].includes(c.status);

      const isResolved = [
        COMPLAINT_STATUS.RESOLVED,
        COMPLAINT_STATUS.CLOSED,
      ].includes(c.status);

      if (isActive) {
        techMap[c.assignedTechnicianId].activeTickets += 1;
      }
      if (isResolved) {
        techMap[c.assignedTechnicianId].resolvedTickets += 1;
      }
    }
  });

  const technicianPerformance = Object.values(techMap)
    .sort((a, b) => b.resolvedTickets - a.resolvedTickets);

  return {
    kpi,
    statusDistribution,
    priorityDistribution,
    categoryDistribution,
    dailyTrend,
    technicianPerformance,
    totalRecords: filteredComplaints.length,
  };
};
