/**
 * Unit tests for notification service.
 * Firebase SDK is mocked in tests/setup.js.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

import {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToUserNotifications,
} from '@/services/notifications/notificationService';

const mockCollRef = {};
const mockDocRef = {};

beforeEach(() => {
  vi.clearAllMocks();
  collection.mockReturnValue(mockCollRef);
  doc.mockReturnValue(mockDocRef);
  query.mockReturnValue({});
  where.mockReturnValue({});
  orderBy.mockReturnValue({});
  limit.mockReturnValue({});
  serverTimestamp.mockReturnValue(new Date());
});

describe('createNotification', () => {
  it('should create a notification with required fields', async () => {
    addDoc.mockResolvedValue({ id: 'notif-001' });

    const notifId = await createNotification({
      recipientId: 'user-123',
      title: 'Test Notification',
      message: 'Your ticket has been updated.',
      type: 'status_change',
      relatedComplaintId: 'complaint-abc',
    });

    expect(notifId).toBe('notif-001');
    expect(addDoc).toHaveBeenCalledWith(
      mockCollRef,
      expect.objectContaining({
        recipientId: 'user-123',
        title: 'Test Notification',
        message: 'Your ticket has been updated.',
        isRead: false,
        readAt: null,
      })
    );
  });

  it('should return null and not create notification when recipientId is missing', async () => {
    const result = await createNotification({
      recipientId: null,
      title: 'Test',
      message: 'Message',
    });

    expect(result).toBeNull();
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('should return null when title is missing', async () => {
    const result = await createNotification({
      recipientId: 'user-123',
      title: '',
      message: 'Message',
    });

    expect(result).toBeNull();
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('should return null when message is missing', async () => {
    const result = await createNotification({
      recipientId: 'user-123',
      title: 'Title',
      message: '',
    });

    expect(result).toBeNull();
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('should default type to status_change if not provided', async () => {
    addDoc.mockResolvedValue({ id: 'notif-002' });

    await createNotification({
      recipientId: 'user-123',
      title: 'Title',
      message: 'Message text',
    });

    expect(addDoc).toHaveBeenCalledWith(
      mockCollRef,
      expect.objectContaining({ type: 'status_change' })
    );
  });
});

describe('markNotificationAsRead', () => {
  it('should update isRead to true and set readAt', async () => {
    updateDoc.mockResolvedValue(undefined);

    await markNotificationAsRead('notif-001', 'user-123');

    expect(updateDoc).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({ isRead: true })
    );
  });

  it('should be a no-op when notificationId is null', async () => {
    await markNotificationAsRead(null, 'user-123');
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('should be a no-op when userId is null', async () => {
    await markNotificationAsRead('notif-001', null);
    expect(updateDoc).not.toHaveBeenCalled();
  });
});

describe('markAllNotificationsAsRead', () => {
  it('should batch-update all unread notifications for user', async () => {
    const mockBatch = {
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    writeBatch.mockReturnValue(mockBatch);

    const mockUnreadDocs = [
      { id: 'n1', ref: { id: 'n1' }, data: () => ({ isRead: false }) },
      { id: 'n2', ref: { id: 'n2' }, data: () => ({ isRead: false }) },
    ];
    getDocs.mockResolvedValue({
      empty: false,
      docs: mockUnreadDocs,
    });

    await markAllNotificationsAsRead('user-123');

    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('should be a no-op when userId is null', async () => {
    await markAllNotificationsAsRead(null);
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('should not commit batch when no unread notifications exist', async () => {
    const mockBatch = {
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    writeBatch.mockReturnValue(mockBatch);
    getDocs.mockResolvedValue({ empty: true, docs: [] });

    await markAllNotificationsAsRead('user-123');

    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});

describe('subscribeToUserNotifications', () => {
  it('should return an unsubscribe function', () => {
    const mockUnsubscribe = vi.fn();
    onSnapshot.mockReturnValue(mockUnsubscribe);

    const unsubscribe = subscribeToUserNotifications('user-123', vi.fn(), vi.fn());

    expect(typeof unsubscribe).toBe('function');
  });

  it('should call callback with empty array and return no-op when userId is null', () => {
    const mockCallback = vi.fn();
    const unsubscribe = subscribeToUserNotifications(null, mockCallback, vi.fn());

    expect(mockCallback).toHaveBeenCalledWith([]);
    expect(typeof unsubscribe).toBe('function');
  });
});
