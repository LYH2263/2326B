import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Select, Modal, Form,
  DatePicker, Input, message, Popconfirm, Tooltip, Typography,
  Descriptions, Timeline, Badge, Row, Col,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  EyeOutlined, SwapOutlined, CheckCircleOutlined,
  RollbackOutlined, SendOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { animalTransferApi, animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const statusOptions = [
  { value: 'pending', label: '待处理', color: 'default', icon: <SendOutlined /> },
  { value: 'in_transit', label: '运输中', color: 'processing', icon: <SwapOutlined /> },
  { value: 'completed', label: '已送达', color: 'success', icon: <CheckCircleOutlined /> },
  { value: 'returned', label: '已归还', color: 'default', icon: <RollbackOutlined /> },
];

const reasonOptions = [
  { value: 'experiment_borrow', label: '实验借用' },
  { value: 'permanent_transfer', label: '永久转移' },
  { value: 'return_to_supplier', label: '退回供应商' },
];

const isBorrowReason = (reason: string) => reason === 'experiment_borrow';

const AnimalTransfers: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [animalFilter, setAnimalFilter] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [animals, setAnimals] = useState<any[]>([]);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);

  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (animalFilter) params.animalId = animalFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await animalTransferApi.getList(params);
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, animalFilter, dateRange]);

  const fetchAnimals = async () => {
    try {
      const res: any = await animalApi.getList({ page: 1, pageSize: 200 });
      setAnimals(res?.list || []);
    } catch {
      // handled
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchAnimals(); }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    setSelectedAnimal(null);
    form.resetFields();
    form.setFieldsValue({ reason: 'experiment_borrow', transferDate: dayjs() });
    setCreateModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    const animal = animals.find(a => a.id === record.animalId);
    setSelectedAnimal(animal || null);
    form.setFieldsValue({
      ...record,
      transferDate: record.transferDate ? dayjs(record.transferDate) : null,
      expectedReturnDate: record.expectedReturnDate ? dayjs(record.expectedReturnDate) : null,
    });
    setCreateModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await animalTransferApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleViewDetail = async (record: any) => {
    try {
      setDetailRecord(record);
      const timelineRes: any = await animalTransferApi.getTimeline(record.id);
      setTimeline(timelineRes || []);
      setDetailModalVisible(true);
    } catch {
      // handled
    }
  };

  const handleAnimalChange = (value: number) => {
    const animal = animals.find(a => a.id === value);
    setSelectedAnimal(animal || null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: any = {
        ...values,
        transferDate: values.transferDate?.format('YYYY-MM-DD'),
      };
      if (values.expectedReturnDate) {
        payload.expectedReturnDate = values.expectedReturnDate.format('YYYY-MM-DD');
      }

      if (editingRecord) {
        await animalTransferApi.update(editingRecord.id, payload);
        message.success('更新成功');
      } else {
        await animalTransferApi.create(payload);
        message.success('创建成功');
      }
      setCreateModalVisible(false);
      fetchData();
    } catch {
      // handled
    }
  };

  const handleStartTransit = async (record: any) => {
    try {
      await animalTransferApi.startTransit(record.id);
      message.success('已发起运输');
      fetchData();
      if (detailRecord && detailRecord.id === record.id) {
        const updated: any = await animalTransferApi.getDetail(record.id);
        setDetailRecord(updated);
        const timelineRes: any = await animalTransferApi.getTimeline(record.id);
        setTimeline(timelineRes || []);
      }
    } catch {
      // handled
    }
  };

  const handleConfirmDelivery = async (record: any) => {
    try {
      await animalTransferApi.confirmDelivery(record.id);
      message.success('已确认送达');
      fetchData();
      if (detailRecord && detailRecord.id === record.id) {
        const updated: any = await animalTransferApi.getDetail(record.id);
        setDetailRecord(updated);
        const timelineRes: any = await animalTransferApi.getTimeline(record.id);
        setTimeline(timelineRes || []);
      }
    } catch {
      // handled
    }
  };

  const handleConfirmReturn = async (record: any) => {
    try {
      await animalTransferApi.confirmReturn(record.id);
      message.success('已确认归还');
      fetchData();
      if (detailRecord && detailRecord.id === record.id) {
        const updated: any = await animalTransferApi.getDetail(record.id);
        setDetailRecord(updated);
        const timelineRes: any = await animalTransferApi.getTimeline(record.id);
        setTimeline(timelineRes || []);
      }
    } catch {
      // handled
    }
  };

  const renderStatusTag = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    if (!opt) return status;
    return <Tag color={opt.color} icon={opt.icon}>{opt.label}</Tag>;
  };

  const renderReasonLabel = (reason: string) => {
    const opt = reasonOptions.find(o => o.value === reason);
    return opt ? opt.label : reason;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '动物',
      key: 'animal',
      width: 140,
      render: (_: any, record: any) => (
        <div>
          <Text strong>{record.animal?.name || `#${record.animalId}`}</Text>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.animal?.species} · {record.animal?.cageNumber || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '转出方',
      dataIndex: 'fromDepartment',
      key: 'fromDepartment',
      width: 140,
    },
    {
      title: '接收方',
      dataIndex: 'toDepartment',
      key: 'toDepartment',
      width: 140,
    },
    {
      title: '转移原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 110,
      render: (r: string) => renderReasonLabel(r),
    },
    {
      title: '转移日期',
      dataIndex: 'transferDate',
      key: 'transferDate',
      width: 110,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => renderStatusTag(s),
    },
    {
      title: '经办人',
      dataIndex: 'handler',
      key: 'handler',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="编辑">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {record.status === 'pending' && (
            <Popconfirm
              title="确定发起运输？"
              onConfirm={() => handleStartTransit(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<SendOutlined />}>
                发起运输
              </Button>
            </Popconfirm>
          )}
          {record.status === 'in_transit' && (
            <Popconfirm
              title="确认已送达？"
              onConfirm={() => handleConfirmDelivery(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                确认送达
              </Button>
            </Popconfirm>
          )}
          {record.status === 'completed' && isBorrowReason(record.reason) && (
            <Popconfirm
              title="确认已归还？"
              onConfirm={() => handleConfirmReturn(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<RollbackOutlined />}>
                确认归还
              </Button>
            </Popconfirm>
          )}
          {record.status === 'pending' && (
            <Popconfirm
              title="确定删除？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const reasonValue = Form.useWatch('reason', form);

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <SwapOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 600 }}>动物转移/借调记录</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建记录
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            placeholder="选择动物"
            allowClear
            showSearch
            optionFilterProp="children"
            style={{ width: 200 }}
            value={animalFilter}
            onChange={(v) => { setAnimalFilter(v); setPage(1); }}
          >
            {animals.map(a => (
              <Option key={a.id} value={a.id}>
                {a.name} ({a.species})
              </Option>
            ))}
          </Select>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
          >
            {statusOptions.map(o => (
              <Option key={o.value} value={o.value}>{o.label}</Option>
            ))}
          </Select>
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            style={{ width: 280 }}
            value={dateRange}
            onChange={(dates) => { setDateRange(dates as any); setPage(1); }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setStatusFilter(undefined);
              setAnimalFilter(undefined);
              setDateRange(null);
              setPage(1);
            }}
          >
            重置
          </Button>
        </div>

        <Table
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      {/* 创建/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑转移记录' : '新建转移记录'}
        open={createModalVisible}
        onOk={handleSubmit}
        onCancel={() => setCreateModalVisible(false)}
        width={680}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              name="animalId"
              label="选择动物"
              rules={[{ required: true, message: '请选择动物' }]}
            >
              <Select
                showSearch
                optionFilterProp="children"
                placeholder="搜索并选择动物"
                onChange={handleAnimalChange}
              >
                {animals.map(a => (
                  <Option key={a.id} value={a.id}>
                    {a.name} ({a.species})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedAnimal && (
              <Form.Item label="当前笼位 / 状态">
                <div style={{ display: 'flex', gap: 12, padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                  <Badge status="processing" text={`笼位: ${selectedAnimal.cageNumber || '-'}`} />
                  <Badge status={selectedAnimal.status === 'healthy' ? 'success' : 'warning'} text={`状态: ${selectedAnimal.status}`} />
                </div>
              </Form.Item>
            )}

            <Form.Item
              name="fromDepartment"
              label="转出方"
              rules={[{ required: true, message: '请填写转出方' }]}
            >
              <Input placeholder="部门/实验室名称" />
            </Form.Item>
            <Form.Item
              name="toDepartment"
              label="接收方"
              rules={[{ required: true, message: '请填写接收方' }]}
            >
              <Input placeholder="部门/实验室名称" />
            </Form.Item>
            <Form.Item
              name="reason"
              label="转移原因"
              rules={[{ required: true, message: '请选择转移原因' }]}
            >
              <Select>
                {reasonOptions.map(o => (
                  <Option key={o.value} value={o.value}>{o.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="transferDate"
              label="转移日期"
              rules={[{ required: true, message: '请选择转移日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            {isBorrowReason(reasonValue || 'experiment_borrow') && (
              <Form.Item
                name="expectedReturnDate"
                label="预计归还日期"
                rules={[{ required: true, message: '借调类型请填写预计归还日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            )}
            <Form.Item
              name="handler"
              label="经办人"
              rules={[{ required: true, message: '请填写经办人' }]}
            >
              <Input placeholder="经办人姓名" />
            </Form.Item>
            <Form.Item name="approver" label="审批人">
              <Input placeholder="审批人姓名" />
            </Form.Item>
          </div>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={3} placeholder="转移相关备注说明" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title="转移记录详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        {detailRecord && (
          <div style={{ marginTop: 8 }}>
            <Descriptions
              title="基本信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="记录ID">{detailRecord.id}</Descriptions.Item>
              <Descriptions.Item label="状态">{renderStatusTag(detailRecord.status)}</Descriptions.Item>
              <Descriptions.Item label="动物">
                {detailRecord.animal?.name || `#${detailRecord.animalId}`}
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  {detailRecord.animal?.species}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="当前笼位">
                {detailRecord.animal?.cageNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="转出方">{detailRecord.fromDepartment}</Descriptions.Item>
              <Descriptions.Item label="接收方">{detailRecord.toDepartment}</Descriptions.Item>
              <Descriptions.Item label="转移原因">{renderReasonLabel(detailRecord.reason)}</Descriptions.Item>
              <Descriptions.Item label="转移日期">
                {detailRecord.transferDate ? dayjs(detailRecord.transferDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              {isBorrowReason(detailRecord.reason) && (
                <>
                  <Descriptions.Item label="预计归还日期">
                    {detailRecord.expectedReturnDate ? dayjs(detailRecord.expectedReturnDate).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="实际归还日期">
                    {detailRecord.actualReturnDate ? dayjs(detailRecord.actualReturnDate).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="经办人">{detailRecord.handler}</Descriptions.Item>
              <Descriptions.Item label="审批人">{detailRecord.approver || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>
                {detailRecord.remarks || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginBottom: 12 }}>
              <SwapOutlined style={{ color: '#1677ff', marginRight: 6 }} />
              状态流转时间线
            </Title>
            <div style={{ padding: '12px 20px', background: '#fafafa', borderRadius: 8 }}>
              <Timeline
                items={timeline.map((item) => {
                  const statusOpt = statusOptions.find(o => o.value === item.status);
                  const color = item.time ? (statusOpt?.color || 'blue') : 'gray';
                  return {
                    color,
                    children: (
                      <div style={{ padding: '4px 0' }}>
                        <Text strong style={{ fontSize: 14 }}>{item.label}</Text>
                        {item.time ? (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                            {dayjs(item.time).format('YYYY-MM-DD HH:mm')}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>待完成</div>
                        )}
                      </div>
                    ),
                  };
                })}
              />
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <Space>
                {detailRecord.status === 'pending' && (
                  <Popconfirm
                    title="确定发起运输？"
                    onConfirm={() => handleStartTransit(detailRecord)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="primary" icon={<SendOutlined />}>
                      发起运输
                    </Button>
                  </Popconfirm>
                )}
                {detailRecord.status === 'in_transit' && (
                  <Popconfirm
                    title="确认已送达？"
                    onConfirm={() => handleConfirmDelivery(detailRecord)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="primary" icon={<CheckCircleOutlined />}>
                      确认送达
                    </Button>
                  </Popconfirm>
                )}
                {detailRecord.status === 'completed' && isBorrowReason(detailRecord.reason) && (
                  <Popconfirm
                    title="确认已归还？"
                    onConfirm={() => handleConfirmReturn(detailRecord)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="primary" danger icon={<RollbackOutlined />}>
                      确认归还
                    </Button>
                  </Popconfirm>
                )}
                <Button onClick={() => setDetailModalVisible(false)}>
                  关闭
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnimalTransfers;
