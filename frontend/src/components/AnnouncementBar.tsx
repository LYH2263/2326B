import React, { useState, useEffect } from 'react';
import { Alert, Modal, Tag, Space } from 'antd';
import { BellOutlined, CloseOutlined } from '@ant-design/icons';
import { announcementApi } from '../api';
import dayjs from 'dayjs';

const typeColorMap: Record<string, string> = {
  notice: 'info',
  warning: 'warning',
  update: 'success',
};

const typeLabelMap: Record<string, string> = {
  notice: '通知',
  warning: '警告',
  update: '更新',
};

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  isPinned: boolean;
  publishTime: string;
  publisher?: { name: string; username: string };
}

const AnnouncementBar: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await announcementApi.getLatest(5);
        const list = (res as unknown as Announcement[]) || [];
        setAnnouncements(list);
      } catch {
        // error handled
      }
    };
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const handleClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setModalVisible(true);
  };

  if (!visible || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const alertType = (typeColorMap[current.type] || 'info') as any;

  return (
    <>
      <Alert
        type={alertType}
        showIcon
        icon={<BellOutlined />}
        message={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => handleClick(current)}
          >
            <Space>
              <Tag color={typeColorMap[current.type]} style={{ margin: 0 }}>
                {typeLabelMap[current.type]}
              </Tag>
              {current.isPinned && <Tag color="red">置顶</Tag>}
              <span style={{ fontWeight: 500 }}>{current.title}</span>
            </Space>
            <Space>
              <span style={{ fontSize: 12, color: '#888', marginRight: 8 }}>
                {dayjs(current.publishTime).format('MM-DD HH:mm')}
              </span>
              {announcements.length > 1 && (
                <span style={{ fontSize: 12, color: '#888' }}>
                  {currentIndex + 1}/{announcements.length}
                </span>
              )}
            </Space>
          </div>
        }
        closable
        closeIcon={<CloseOutlined />}
        onClose={() => setVisible(false)}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />

      <Modal
        title={
          <Space>
            <Tag color={typeColorMap[selectedAnnouncement?.type || 'notice']}>
              {typeLabelMap[selectedAnnouncement?.type || 'notice']}
            </Tag>
            {selectedAnnouncement?.isPinned && <Tag color="red">置顶</Tag>}
            <span>{selectedAnnouncement?.title}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedAnnouncement && (
          <div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
              发布人：{selectedAnnouncement.publisher?.name || selectedAnnouncement.publisher?.username || '系统'}
              <span style={{ marginLeft: 16 }}>
                {dayjs(selectedAnnouncement.publishTime).format('YYYY-MM-DD HH:mm')}
              </span>
            </div>
            <div
              style={{
                borderTop: '1px solid #eee',
                paddingTop: 16,
                lineHeight: 1.8,
              }}
              dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default AnnouncementBar;
