import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Button, Empty, Spin } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { notificationService, Notification } from '../services/notification.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll();
      setNotifications(data);
      const count = data.filter((n) => !n.read).length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDropdownVisibleChange = (visible: boolean) => {
    setDropdownVisible(visible);
    if (visible) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return '📋';
      case 'TASK_SUBMITTED':
        return '✅';
      case 'TASK_APPROVED':
        return '👍';
      case 'TASK_REJECTED':
        return '❌';
      case 'TASK_DEADLINE_NEAR':
        return '⏰';
      case 'KPI_PUBLISHED':
        return '📊';
      case 'PEER_REVIEW_REQUEST':
        return '👥';
      default:
        return '🔔';
    }
  };

  const dropdownMenu = (
    <div
      style={{
        width: 380,
        maxHeight: 500,
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong style={{ fontSize: 16 }}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ padding: 40 }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                key={notification.id}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: notification.read ? 'transparent' : '#f0f7ff',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>
                        {notification.title}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: 13, display: 'block', marginBottom: 4 }}
                      >
                        {notification.message}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(notification.createdAt).fromNow()}
                      </Text>
                    </div>
                    {!notification.read && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#1890ff',
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown
      menu={{ items: [] }}
      popupRender={() => dropdownMenu}
      trigger={['click']}
      open={dropdownVisible}
      onOpenChange={handleDropdownVisibleChange}
      placement="bottomRight"
    >
      <Badge count={unreadCount} offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          style={{ color: '#fff' }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
