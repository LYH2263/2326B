import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import { announcementApi } from '../api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const typeMap: Record<string, { label: string; color: string }> = {
  notice: { label: '通知', color: 'blue' },
  warning: { label: '警告', color: 'warning' },
  update: { label: '更新', color: 'success' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  published: { label: '已发布', color: 'success' },
  archived: { label: '已归档', color: 'default' },
};

const AnnouncementManage: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchList = async () => {
    try {
      setLoading(true);
      const res: any = await announcementApi.getList({ page, pageSize });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, pageSize]);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'notice',
      status: 'draft',
      isPinned: false,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      type: record.type,
      status: record.status,
      isPinned: record.isPinned,
    });
    setModalVisible(true);
  };

  const handlePreview = (record: any) => {
    setPreviewData(record);
    setPreviewVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await announcementApi.delete(id);
      message.success('删除成功');
      fetchList();
    } catch {
      // error handled
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await announcementApi.update(editingId, values);
        message.success('更新成功');
      } else {
        await announcementApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchList();
    } catch {
      // error handled
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: any) => (
        <Space>
          {record.isPinned && <PushpinOutlined style={{ color: '#f5222d' }} />}
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={typeMap[type]?.color}>{typeMap[type]?.label || type}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.label || status}</Tag>
      ),
    },
    {
      title: '发布人',
      dataIndex: 'publisher',
      key: 'publisher',
      width: 120,
      render: (publisher: any) => publisher?.name || publisher?.username || '-',
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      width: 180,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>
            预览
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此公告？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>公告管理</h3>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建公告
          </Button>
        </div>
        <Table
          dataSource={list}
          columns={columns}
          rowKey="id"
          loading={loading}
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

      <Modal
        title={editingId ? '编辑公告' : '新建公告'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入公告标题" maxLength={200} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select>
                  <Select.Option value="notice">通知</Select.Option>
                  <Select.Option value="warning">警告</Select.Option>
                  <Select.Option value="update">更新</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="published">发布</Select.Option>
                  <Select.Option value="archived">归档</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isPinned" label="置顶" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={12} placeholder="支持 HTML 富文本内容" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="公告预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={600}
      >
        {previewData && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color={typeMap[previewData.type]?.color}>
                  {typeMap[previewData.type]?.label}
                </Tag>
                {previewData.isPinned && <Tag color="red">置顶</Tag>}
              </Space>
            </div>
            <h3 style={{ marginBottom: 8 }}>{previewData.title}</h3>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
              发布人：{previewData.publisher?.name || previewData.publisher?.username || '-'}
              {previewData.publishTime && ` · ${dayjs(previewData.publishTime).format('YYYY-MM-DD HH:mm')}`}
            </div>
            <div
              className="rich-text-content"
              style={{
                borderTop: '1px solid #eee',
                paddingTop: 16,
                lineHeight: 1.8,
              }}
              dangerouslySetInnerHTML={{ __html: previewData.content }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnnouncementManage;
