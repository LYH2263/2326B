import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Select, Modal, Form,
  DatePicker, Input, InputNumber, message, Popconfirm, Tooltip, Typography,
  Row, Col, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  EyeOutlined, SendOutlined, RollbackOutlined, FileTextOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { animalUsageRequestApi, experimentApi, animalApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const statusOptions = [
  { value: 'draft', label: '草稿', color: 'default' },
  { value: 'submitted', label: '待审批', color: 'processing' },
  { value: 'approved', label: '已通过', color: 'success' },
  { value: 'rejected', label: '已拒绝', color: 'error' },
  { value: 'withdrawn', label: '已撤回', color: 'warning' },
];

const genderOptions = [
  { value: 'any', label: '不限' },
  { value: 'male', label: '雄性' },
  { value: 'female', label: '雌性' },
];

const MyUsageRequests: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<string[]>([]);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await animalUsageRequestApi.getMyRequests(params);
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, dateRange]);

  const fetchExperiments = async () => {
    try {
      const res: any = await experimentApi.getList({ page: 1, pageSize: 200 });
      setExperiments(res?.list || []);
    } catch {
    }
  };

  const fetchSpecies = async () => {
    try {
      const res: any = await animalApi.getSpecies();
      setSpeciesList(res || []);
    } catch {
      setSpeciesList(['小鼠', '大鼠', '家兔', '豚鼠']);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchExperiments(); fetchSpecies(); }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      genderRequirement: 'any',
      quantity: 1,
    });
    setCreateModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      minWeight: record.minWeight ? Number(record.minWeight) : undefined,
      maxWeight: record.maxWeight ? Number(record.maxWeight) : undefined,
    });
    setCreateModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await animalUsageRequestApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch {
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await animalUsageRequestApi.submit(id);
      message.success('提交成功');
      fetchData();
    } catch {
    }
  };

  const handleWithdraw = async (id: number) => {
    try {
      await animalUsageRequestApi.withdraw(id);
      message.success('撤回成功');
      fetchData();
    } catch {
    }
  };

  const handleViewDetail = (record: any) => {
    navigate(`/animal-usage-requests/${record.id}`);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: any = {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
      };

      if (editingRecord) {
        await animalUsageRequestApi.update(editingRecord.id, payload);
        message.success('更新成功');
      } else {
        await animalUsageRequestApi.create(payload);
        message.success('创建成功');
      }
      setCreateModalVisible(false);
      fetchData();
    } catch {
    }
  };

  const renderStatusTag = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    if (!opt) return status;
    return <Tag color={opt.color}>{opt.label}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '物种/品系',
      key: 'species',
      width: 140,
      render: (_: any, record: any) => (
        <div>
          <Text strong>{record.species}</Text>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.strain || '-'}
          </div>
        </div>
      ),
    },
    {
      title: '申请数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      render: (q: number) => `${q} 只`,
    },
    {
      title: '性别要求',
      dataIndex: 'genderRequirement',
      key: 'genderRequirement',
      width: 90,
      render: (g: string) => {
        const opt = genderOptions.find(o => o.value === g);
        return opt ? opt.label : g;
      },
    },
    {
      title: '关联实验',
      key: 'experiment',
      width: 160,
      render: (_: any, record: any) => (
        record.experiment?.name || '-'
      ),
    },
    {
      title: '使用周期',
      key: 'period',
      width: 200,
      render: (_: any, record: any) => (
        <div>
          <div>{record.startDate ? dayjs(record.startDate).format('YYYY-MM-DD') : '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            至 {record.endDate ? dayjs(record.endDate).format('YYYY-MM-DD') : '-'}
          </div>
        </div>
      ),
    },
    {
      title: '申请日期',
      dataIndex: 'requestDate',
      key: 'requestDate',
      width: 110,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => renderStatusTag(s),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title="编辑">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {record.status === 'draft' && (
            <Popconfirm
              title="确定提交申请？提交后将进入审批流程"
              onConfirm={() => handleSubmit(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<SendOutlined />}>
                提交
              </Button>
            </Popconfirm>
          )}
          {(record.status === 'submitted' || record.status === 'approved') && (
            <Popconfirm
              title="确定撤回申请？"
              onConfirm={() => handleWithdraw(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<RollbackOutlined />}>
                撤回
              </Button>
            </Popconfirm>
          )}
          {record.status === 'draft' && (
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

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 600 }}>我的使用申请</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建申请
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
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
        title={editingRecord ? '编辑使用申请' : '新建使用申请'}
        open={createModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => setCreateModalVisible(false)}
        width={720}
        okText="保存草稿"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="species"
                label="物种"
                rules={[{ required: true, message: '请选择物种' }]}
              >
                <Select placeholder="请选择物种">
                  {speciesList.map(s => (
                    <Option key={s} value={s}>{s}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="strain"
                label="品系"
              >
                <Input placeholder="请输入品系" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="申请数量"
                rules={[{ required: true, message: '请填写申请数量' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="genderRequirement"
                label="性别要求"
                rules={[{ required: true, message: '请选择性别要求' }]}
              >
                <Select>
                  {genderOptions.map(o => (
                    <Option key={o.value} value={o.value}>{o.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="体重范围">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="minWeight"
                    noStyle
                  >
                    <InputNumber placeholder="最小(g)" min={0} style={{ width: '50%' }} />
                  </Form.Item>
                  <Form.Item
                    name="maxWeight"
                    noStyle
                  >
                    <InputNumber placeholder="最大(g)" min={0} style={{ width: '50%' }} />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="预计开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="预计结束日期"
                rules={[{ required: true, message: '请选择结束日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="experimentId"
            label="关联实验项目（可选）"
          >
            <Select placeholder="选择已有实验项目" allowClear showSearch optionFilterProp="children">
              {experiments.map(e => (
                <Option key={e.id} value={e.id}>{e.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="purpose"
            label="使用目的描述"
            rules={[{ required: true, message: '请填写使用目的' }]}
          >
            <TextArea rows={4} placeholder="请详细描述实验目的和用途" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyUsageRequests;
