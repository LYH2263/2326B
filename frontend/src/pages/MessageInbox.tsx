import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Drawer,
  Input,
  Select,
  message,
  Card,
  Tabs,
  Empty,
  Tooltip,
  Checkbox,
  Row,
  Col,
} from 'antd';
import {
  InboxOutlined,
  SendOutlined,
  EditOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { messageApi, userApi } from '../api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Search } = Input;

interface MessageItem {
  id: number;
  title: string;
  content: string;
  sender?: { id: number; name: string; username: string };
  receiver?: { id: number; name: string; username: string };
  isRead: boolean;
  sendTime: string;
  relatedType?: string;
  relatedId?: number;
}

const MessageInbox: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inbox');
  const [list, setList] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<MessageItem | null>(null);
  const [keyword, setKeyword] = useState('');
  const [filterRead, setFilterRead] = useState<string>('all');

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res: any = await messageApi.getUnreadCount();
      setUnreadCount(res.count || 0);
    } catch {
      // error handled
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (activeTab === 'inbox' && filterRead !== 'all') {
        params.isRead = filterRead === 'read';
      }

      let res: any;
      if (activeTab === 'inbox') {
        res = await messageApi.getInbox(params);
      } else {
        res = await messageApi.getOutbox(params);
      }
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch {
      // error handled
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, keyword, filterRead]);

  useEffect(() => {
    fetchList();
    if (activeTab === 'inbox') {
      fetchUnreadCount();
    }
  }, [activeTab, page, pageSize, keyword, filterRead, fetchList, fetchUnreadCount]);

  const handleViewMessage = async (record: MessageItem) => {
    setCurrentMessage(record);
    setDrawerVisible(true);
    if (activeTab === 'inbox' && !record.isRead) {
      try {
        await messageApi.markAsRead(record.id);
        setList((prev) =>
          prev.map((item) =>
            item.id === record.id ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // error handled
      }
    }
  };

  const handleBatchMarkRead = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择消息');
      return;
    }
    try {
      await messageApi.batchMarkRead(selectedRowKeys.map(Number));
      message.success(`已标记 ${selectedRowKeys.length} 条消息为已读`);
      setSelectedRowKeys([]);
      fetchList();
      fetchUnreadCount();
    } catch {
      // error handled
    }
  };

  const renderRelatedInfo = (msg: MessageItem) => {
    if (!msg.relatedType || !msg.relatedId) return null;
    const typeLabel: Record<string, string> = {
      animal: '动物',
      experiment: '实验',
    };
    return (
      <Tag color="blue">
        关联{typeLabel[msg.relatedType] || msg.relatedType}：#{msg.relatedId}
      </Tag>
    );
  };

  const inboxColumns = [
    {
      title: '发件人',
      dataIndex: 'sender',
      key: 'sender',
      width: 120,
      render: (sender: any) => sender?.name || sender?.username || '-',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: MessageItem) => (
        <Space>
          {!record.isRead && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#1677ff',
                display: 'inline-block',
              }}
            />
          )}
          <span style={{ fontWeight: record.isRead ? 400 : 600 }}>{text}</span>
          {renderRelatedInfo(record)}
        </Space>
      ),
    },
    {
      title: '发送时间',
      dataIndex: 'sendTime',
      key: 'sendTime',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 80,
      render: (isRead: boolean) => (
        <Tag color={isRead ? 'default' : 'blue'}>
          {isRead ? '已读' : '未读'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: MessageItem) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewMessage(record)}>
          查看
        </Button>
      ),
    },
  ];

  const outboxColumns = [
    {
      title: '收件人',
      dataIndex: 'receiver',
      key: 'receiver',
      width: 120,
      render: (receiver: any) => receiver?.name || receiver?.username || '-',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: MessageItem) => (
        <Space>
          <span>{text}</span>
          {renderRelatedInfo(record)}
        </Space>
      ),
    },
    {
      title: '发送时间',
      dataIndex: 'sendTime',
      key: 'sendTime',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: MessageItem) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewMessage(record)}>
          查看
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const tabItems = [
    {
      key: 'inbox',
      label: (
        <span>
          <InboxOutlined /> 收件箱
          {unreadCount > 0 && (
            <Tag color="red" style={{ marginLeft: 8 }}>
              {unreadCount}
            </Tag>
          )}
        </span>
      ),
    },
    {
      key: 'outbox',
      label: (
        <span>
          <SendOutlined /> 发件箱
        </span>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs
            items={tabItems}
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ marginBottom: 0 }}
          />
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate('/messages/compose')}>
            写信
          </Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Search
              placeholder="搜索标题"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => {
                setKeyword(value);
                setPage(1);
              }}
              style={{ maxWidth: 400 }}
            />
          </Col>
          {activeTab === 'inbox' && (
            <Col span={12} style={{ textAlign: 'right' }}>
              <Space>
                <Select
                  value={filterRead}
                  onChange={(val) => {
                    setFilterRead(val);
                    setPage(1);
                  }}
                  style={{ width: 120 }}
                >
                  <Select.Option value="all">全部</Select.Option>
                  <Select.Option value="unread">未读</Select.Option>
                  <Select.Option value="read">已读</Select.Option>
                </Select>
                <Button icon={<CheckCircleOutlined />} onClick={handleBatchMarkRead}>
                  标记已读
                </Button>
              </Space>
            </Col>
          )}
        </Row>

        <Table
          dataSource={list}
          columns={activeTab === 'inbox' ? inboxColumns : outboxColumns}
          rowKey="id"
          loading={loading}
          rowSelection={activeTab === 'inbox' ? rowSelection : undefined}
          onRow={(record) => ({
            onClick: () => handleViewMessage(record as MessageItem),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Drawer
        title={activeTab === 'inbox' ? '消息详情' : '已发消息详情'}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {currentMessage && (
          <div>
            <h3 style={{ marginBottom: 12 }}>{currentMessage.title}</h3>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
              {activeTab === 'inbox' ? (
                <span>
                  发件人：{currentMessage.sender?.name || currentMessage.sender?.username || '-'}
                </span>
              ) : (
                <span>
                  收件人：{currentMessage.receiver?.name || currentMessage.receiver?.username || '-'}
                </span>
              )}
              <span style={{ marginLeft: 16 }}>
                {dayjs(currentMessage.sendTime).format('YYYY-MM-DD HH:mm')}
              </span>
            </div>
            {renderRelatedInfo(currentMessage)}
            <div
              style={{
                borderTop: '1px solid #eee',
                paddingTop: 16,
                marginTop: 16,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {currentMessage.content}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MessageInbox;
