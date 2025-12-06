import { prisma } from './db';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  linkUrl?: string;
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  linkUrl,
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      notificationType: type,
      linkUrl,
    },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.update({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function deleteNotification(notificationId: string, userId: string) {
  return prisma.notification.delete({
    where: {
      id: notificationId,
      userId,
    },
  });
}

// Helper functions for specific notification types
export async function notifyNewBooking(
  userId: string,
  guestName: string,
  propertyName: string,
  bookingId: string
) {
  return createNotification({
    userId,
    title: 'New booking request',
    message: `${guestName} requested to book ${propertyName}`,
    type: 'BOOKING',
    linkUrl: `/bookings/${bookingId}`,
  });
}

export async function notifyBookingConfirmed(
  userId: string,
  guestName: string,
  propertyName: string,
  bookingId: string
) {
  return createNotification({
    userId,
    title: 'Booking confirmed',
    message: `Booking for ${guestName} at ${propertyName} has been confirmed`,
    type: 'BOOKING',
    linkUrl: `/bookings/${bookingId}`,
  });
}

export async function notifyPaymentReceived(
  userId: string,
  amount: string,
  payerName: string,
  paymentId: string
) {
  return createNotification({
    userId,
    title: 'Payment received',
    message: `${amount} payment received from ${payerName}`,
    type: 'PAYMENT',
    linkUrl: `/financials/income?payment=${paymentId}`,
  });
}

export async function notifyMaintenanceRequest(
  userId: string,
  title: string,
  propertyName: string,
  maintenanceId: string
) {
  return createNotification({
    userId,
    title: 'New maintenance request',
    message: `${title} at ${propertyName}`,
    type: 'MAINTENANCE',
    linkUrl: `/maintenance/${maintenanceId}`,
  });
}

export async function notifyNewInquiry(
  userId: string,
  contactName: string,
  propertyName: string | null,
  inquiryId: string
) {
  return createNotification({
    userId,
    title: 'New inquiry',
    message: propertyName
      ? `${contactName} inquired about ${propertyName}`
      : `New inquiry from ${contactName}`,
    type: 'INQUIRY',
    linkUrl: `/inquiries/${inquiryId}`,
  });
}

export async function notifyNewReview(
  userId: string,
  reviewerName: string,
  propertyName: string,
  rating: number,
  reviewId: string
) {
  return createNotification({
    userId,
    title: 'New review',
    message: `${reviewerName} left a ${rating}-star review for ${propertyName}`,
    type: 'REVIEW',
    linkUrl: `/properties?review=${reviewId}`,
  });
}

export async function notifyTaskDue(userId: string, taskTitle: string, taskId: string) {
  return createNotification({
    userId,
    title: 'Task due soon',
    message: taskTitle,
    type: 'TASK',
    linkUrl: `/tasks?id=${taskId}`,
  });
}

export async function notifyStaleMaintenance(
  userId: string,
  maintenanceTitle: string,
  propertyName: string,
  daysStale: number,
  maintenanceId: string
) {
  return createNotification({
    userId,
    title: 'Stale maintenance request',
    message: `${maintenanceTitle} at ${propertyName} has been pending for ${daysStale} days`,
    type: 'MAINTENANCE',
    linkUrl: `/maintenance/${maintenanceId}`,
  });
}
