import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Switch,
  TimePicker,
  InputNumber,
} from 'antd';
import {
  CloudUploadOutlined,
  DownloadOutlined,
  ReloadOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import api, { backupApi } from '../api';
import dayjs from 'dayjs';

const { confirm } = Modal;

const statusMap: Record<string, { label: string; color: string }> = {
  success: { label: '成功', color: 'success' },
  failed: { label: '失败', color: 'error' },
  running: { label: '进行中', color: 'processing' },
};

const typeMap: Record<string, { label: string; color: string }> = {
  auto: { label: '自动备份', color: 'blue' },
  manual: { label: '手动备份', color: 'default' },
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const BackupManage: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [currentBackupId, setCurrentBackupId] = useState<number | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [autoBackupTime, setAutoBackupTime] = useState(dayjs('02:00', 'HH:mm'));
  const [cleanupDays, setCleanupDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const [form] = Form.useForm();
  const [cleanupForm] = Form.useForm();

  const fetchList = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.backupType = typeFilter;
      const res: any = await backupApi.getRecords(params);
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res: any = await backupApi.getStatus();
      setBackupInProgress(res.backupInProgress);
      setAutoBackupEnabled(res.autoBackupEnabled);
      if (res.autoBackupTime) {
        setAutoBackupTime(dayjs(res.autoBackupTime, 'HH:mm'));
      }
    } catch {
      // error handled
    }
  };

  useEffect(() => {
    fetchList();
    fetchStatus();
  }, [page, pageSize, statusFilter, typeFilter]);

  useEffect(() => {
    if (backupInProgress && currentBackupId) {
      startProgressPolling();
    } else {
      stopProgressPolling();
    }
    return () => stopProgressPolling();
  }, [backupInProgress, currentBackupId]);

  const startProgressPolling = () => {
    stopProgressPolling();
    let progress = 0;
    progressTimer.current = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90;
      setBackupProgress(progress);

      if (currentBackupId) {
        backupApi.getRecordDetail(currentBackupId).then((res: any) => {
          if (res.status !== 'running') {
            setBackupInProgress(false);
            setBackupProgress(100);
            fetchList();
            if (res.status === 'success') {
              message.success('备份完成');
            } else {
              message.error('备份失败');
            }
            setTimeout(() => {
              setBackupProgress(0);
              setCurrentBackupId(null);
            }, 2000);
          }
        }).catch(() => {
          // error handled
        });
      }
    }, 2000);
  };

  const stopProgressPolling = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const handleCreateBackup = async () => {
    if (backupInProgress) {
      message.warning('已有备份任务正在进行中');
      return;
    }
    try {
      setBackupInProgress(true);
      setBackupProgress(0);
      const res: any = await backupApi.createBackup();
      setCurrentBackupId(res.id);
      message.info('备份任务已开始，请稍候...');
    } catch {
      setBackupInProgress(false);
    }
  };

  const handleDownload = async (record: any) => {
    if (record.status !== 'success') {
      message.warning('仅成功的备份可下载');
      return;
    }
    try {
      const response: any = await api.get(`/backup/download/${record.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.download = record.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('下载失败');
    }
  };

  const showRestoreModal = (record: any) => {
    if (record.status !== 'success') {
      message.warning('仅成功的备份可恢复');
      return;
    }
    form.resetFields();
    confirm({
      title: '确认恢复数据',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <Alert
            type="error"
            showIcon
            message="危险操作"
            description="恢复数据将覆盖当前所有数据，此操作不可撤销！"
            style={{ marginBottom: 16 }}
          />
          <div style={{ marginBottom: 8 }}>
            备份文件：<strong>{record.fileName}</strong>
          </div>
          <div style={{ marginBottom: 8 }}>
            备份时间：{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </div>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="confirmText"
              label='请输入"确认恢复"以继续'
              rules={[
                { required: true, message: '请输入确认文本' },
                {
                  validator: (_, value) =>
                    value === '确认恢复'
                      ? Promise.resolve()
                      : Promise.reject(new Error('请输入正确的确认文本')),
                },
              ]}
            >
              <Input placeholder='请输入"确认恢复"' />
            </Form.Item>
          </Form>
        </div>
      ),
      okText: '确认恢复',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const values = await form.validateFields();
          await backupApi.restoreBackup(record.id, values.confirmText);
          message.success('数据恢复成功');
          fetchList();
        } catch {
          return Promise.reject();
        }
      },
    });
  };

  const handleCleanup = async () => {
    try {
      const values = await cleanupForm.validateFields();
      confirm({
        title: '确认清理旧备份',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <Alert
              type="warning"
              showIcon
              message="此操作将删除所有超过设定天数的备份文件"
              description={`将删除 ${values.days} 天前的所有备份文件和记录，此操作不可撤销！`}
              style={{ marginBottom: 16 }}
            />
          </div>
        ),
        okText: '确认清理',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            const res: any = await backupApi.cleanupOldBackups(values.days);
            message.success(`清理完成，删除了 ${res.deletedCount} 个备份文件，${res.deletedRecords} 条记录`);
            fetchList();
          } catch {
            return Promise.reject();
          }
        },
      });
    } catch {
      // validation error
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await backupApi.deleteBackup(id);
      message.success('删除成功');
      fetchList();
    } catch {
      // error handled
    }
  };

  const handleAutoBackupToggle = async (checked: boolean) => {
    try {
      const res: any = await backupApi.setAutoBackupConfig({
        enabled: checked,
        hour: autoBackupTime.hour(),
        minute: autoBackupTime.minute(),
      });
      setAutoBackupEnabled(res.autoBackupEnabled);
      message.success(checked ? '自动备份已开启' : '自动备份已关闭');
    } catch {
      // error handled
    }
  };

  const handleAutoBackupTimeChange = (time: any) => {
    if (time) {
      setAutoBackupTime(time);
      backupApi.setAutoBackupConfig({
        enabled: autoBackupEnabled,
        hour: time.hour(),
        minute: time.minute(),
      }).then((res: any) => {
        message.success('自动备份时间已更新');
      }).catch(() => {
        // error handled
      });
    }
  };

  const successCount = list.filter((item) => item.status === 'success').length;
  const totalSize = list.reduce((sum, item) => sum + (item.fileSize || 0), 0);

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      ellipsis: true,
    },
    {
      title: '备份类型',
      dataIndex: 'backupType',
      key: 'backupType',
      width: 120,
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
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 120,
      render: (size: number) => formatFileSize(size || 0),
    },
    {
      title: '备份耗时',
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 120,
      render: (ms: number) => (ms ? `${(ms / 1000).toFixed(2)} 秒` : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
            disabled={record.status !== 'success'}
          >
            下载
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<ReloadOutlined />}
            onClick={() => showRestoreModal(record)}
            disabled={record.status !== 'success'}
          >
            恢复
          </Button>
          <Popconfirm
            title="确定删除此备份？"
            description="删除后将无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okType="danger"
          >
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
      {backupInProgress && (
        <Alert
          type="info"
          showIcon
          icon={<DatabaseOutlined spin />}
          message="备份进行中..."
          description={
            <Progress percent={Math.round(backupProgress)} size="small" status="active" />
          }
          style={{ marginBottom: 16 }}
          closable={false}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="备份总数"
              value={total}
              prefix={<DatabaseOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="成功备份"
              value={successCount}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
              prefix={<CloudUploadOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="总占用空间"
              value={formatFileSize(totalSize)}
              valueStyle={{ fontSize: 20 }}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="自动备份"
              value={autoBackupEnabled ? '已开启' : '已关闭'}
              valueStyle={{ color: autoBackupEnabled ? '#52c41a' : '#999', fontSize: 20 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>备份策略设置</h3>
        </div>
        <Row gutter={24}>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>定时自动备份</div>
                <div style={{ color: '#999', fontSize: 13 }}>每日自动执行数据库备份</div>
              </div>
              <Switch checked={autoBackupEnabled} onChange={handleAutoBackupToggle} />
            </div>
          </Col>
          <Col span={8}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>备份时间</div>
                <div style={{ color: '#999', fontSize: 13 }}>每天在此时间自动备份</div>
              </div>
              <TimePicker
                format="HH:mm"
                value={autoBackupTime}
                onChange={handleAutoBackupTimeChange}
                disabled={!autoBackupEnabled}
                allowClear={false}
              />
            </div>
          </Col>
          <Col span={8}>
            <Form form={cleanupForm} layout="inline" initialValues={{ days: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>保留天数</div>
                  <div style={{ color: '#999', fontSize: 13 }}>超过此天数的备份将被清理</div>
                </div>
                <Space>
                  <Form.Item name="days" style={{ marginBottom: 0 }}>
                    <InputNumber min={1} max={365} style={{ width: 80 }} />
                  </Form.Item>
                  <Button
                    type="primary"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleCleanup}
                    size="small"
                  >
                    立即清理
                  </Button>
                </Space>
              </div>
            </Form>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0 }}>备份记录</h3>
            <Space>
              <Select
                placeholder="状态筛选"
                allowClear
                style={{ width: 120 }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Select.Option value="success">成功</Select.Option>
                <Select.Option value="failed">失败</Select.Option>
                <Select.Option value="running">进行中</Select.Option>
              </Select>
              <Select
                placeholder="类型筛选"
                allowClear
                style={{ width: 120 }}
                value={typeFilter}
                onChange={setTypeFilter}
              >
                <Select.Option value="auto">自动备份</Select.Option>
                <Select.Option value="manual">手动备份</Select.Option>
              </Select>
            </Space>
          </div>
          <Space>
            <Button icon={<SettingOutlined />} onClick={fetchList}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={handleCreateBackup}
              loading={backupInProgress}
            >
              立即备份
            </Button>
          </Space>
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
    </div>
  );
};

export default BackupManage;
