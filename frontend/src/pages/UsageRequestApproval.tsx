import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Select, Modal, Form,
  DatePicker, Input, message, Tooltip, Typography,
  Row, Col, Checkbox, List, Badge, Empty,
} from 'antd';
import {
  ReloadOutlined, EyeOutlined, CheckCircleOutlined,
  CloseCircleOutlined, AuditOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { animalUsageRequestApi } from '../api';

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

const genderLabels: Record<string, string> = {
  male: '雄性',
  female: '雌性',
  any: '不限',
};

const UsageRequestApproval: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('submitted');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [applicantFilter, setApplicantFilter] = useState<number | undefined>();

  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [availableAnimals, setAvailableAnimals] = useState<any[]>([]);
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<number[]>([]);
  const [animalsLoading, setAnimalsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [rejectForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (applicantFilter) params.applicantId = applicantFilter;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res: any = await animalUsageRequestApi.getList(params);
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, applicantFilter, dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleViewDetail = (record: any) => {
    navigate(`/animal-usage-requests/${record.id}`);
  };

  const handleApprove = async (record: any) => {
    setCurrentRecord(record);
    setSelectedAnimalIds([]);
    setSearchKeyword('');
    setApproveModalVisible(true);
    setAnimalsLoading(true);
    try {
      const res: any = await animalUsageRequestApi.getAvailableAnimals(record.id);
      setAvailableAnimals(res || []);
    } catch {
      setAvailableAnimals([]);
    } finally {
      setAnimalsLoading(false);
    }
  };

  const handleReject = (record: any) => {
    setCurrentRecord(record);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filtered = filteredAnimals.map(a => a.id);
      setSelectedAnimalIds(filtered.slice(0, currentRecord?.quantity || 0));
    } else {
      setSelectedAnimalIds([]);
    }
  };

  const handleAnimalSelect = (animalId: number, checked: boolean) => {
    if (checked) {
      if (selectedAnimalIds.length >= (currentRecord?.quantity || 0)) {
        message.warning(`最多只能选择 ${currentRecord?.quantity} 只动物`);
        return;
      }
      setSelectedAnimalIds([...selectedAnimalIds, animalId]);
    } else {
      setSelectedAnimalIds(selectedAnimalIds.filter(id => id !== animalId));
    }
  };

  const handleConfirmApprove = async () => {
    if (selectedAnimalIds.length !== currentRecord?.quantity) {
      message.warning(`请选择 ${currentRecord?.quantity} 只动物`);
      return;
    }
    try {
      const formData = { animalIds: selectedAnimalIds };
      await animalUsageRequestApi.approve(currentRecord.id, formData);
      message.success('审批通过');
      setApproveModalVisible(false);
      fetchData();
    } catch {
    }
  };

  const handleConfirmReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      await animalUsageRequestApi.reject(currentRecord.id, values);
      message.success('已拒绝');
      setRejectModalVisible(false);
      fetchData();
    } catch {
    }
  };

  const filteredAnimals = availableAnimals.filter(a => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      a.name?.toLowerCase().includes(kw) ||
      a.cageNumber?.toLowerCase().includes(kw) ||
      a.rfidTag?.toLowerCase().includes(kw)
    );
  });

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
      title: '申请人',
      key: 'applicant',
      width: 120,
      render: (_: any, record: any) => (
        record.applicant?.name || record.applicant?.username || '-'
      ),
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
      render: (g: string) => genderLabels[g] || g,
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
      width: 180,
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
      width: 200,
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
          {record.status === 'submitted' && (
            <Tooltip title="审批通过">
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove(record)}
              >
                通过
              </Button>
            </Tooltip>
          )}
          {record.status === 'submitted' && (
            <Tooltip title="审批拒绝">
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record)}
              >
                拒绝
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const allChecked = filteredAnimals.length > 0 && selectedAnimalIds.length === currentRecord?.quantity;
  const indeterminate = selectedAnimalIds.length > 0 && selectedAnimalIds.length < (currentRecord?.quantity || 0);

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <AuditOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 600 }}>使用申请审批</span>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            placeholder="状态筛选"
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
            onChange={(dates: any) => { setDateRange(dates as any); setPage(1); }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setStatusFilter('submitted');
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
          scroll={{ x: 1300 }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      {/* 审批通过弹窗 */}
      <Modal
        title="审批通过 - 选择分配动物"
        open={approveModalVisible}
        onOk={handleConfirmApprove}
        onCancel={() => setApproveModalVisible(false)}
        width={800}
        okText="确认通过"
        cancelText="取消"
        destroyOnClose
        okButtonProps={{ disabled: selectedAnimalIds.length !== currentRecord?.quantity }}
      >
        {currentRecord && (
          <div style={{ marginTop: 8 }}>
            <div style={{ padding: '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Text type="secondary">物种：</Text>
                </Col>
                <Col span={16}>
                  <Text strong>{currentRecord.species} {currentRecord.strain ? `(${currentRecord.strain})` : ''}</Text>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Text type="secondary">申请数量：</Text>
                </Col>
                <Col span={16}>
                  <Text strong>{currentRecord.quantity} 只</Text>
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    已选 {selectedAnimalIds.length}/{currentRecord.quantity}
                  </Tag>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Text type="secondary">性别要求：</Text>
                </Col>
                <Col span={16}>
                  <Text strong>{genderLabels[currentRecord.genderRequirement] || '-'}</Text>
                </Col>
              </Row>
              {currentRecord.minWeight || currentRecord.maxWeight ? (
                <Row gutter={16}>
                  <Col span={8}>
                    <Text type="secondary">体重范围：</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>
                      {currentRecord.minWeight || '-'} ~ {currentRecord.maxWeight || '-'} g
                    </Text>
                  </Col>
                </Row>
              ) : null}
            </div>

            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Checkbox
                indeterminate={indeterminate}
                checked={allChecked}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选（筛选结果）
              </Checkbox>
              <Input
                placeholder="搜索动物名称/笼位/RFID"
                prefix={<SearchOutlined />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 240 }}
                allowClear
              />
            </div>

            <div
              style={{
                maxHeight: 320,
                overflowY: 'auto',
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              {animalsLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                加载中...
              </div>
            ) : filteredAnimals.length === 0 ? (
                <Empty description="暂无符合条件的动物" style={{ padding: '40px 0' }} />
              ) : (
                <List
                  dataSource={filteredAnimals}
                  renderItem={(item: any) => (
                    <List.Item
                      key={item.id}
                      style={{
                        padding: '8px 4px',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      <Checkbox
                        checked={selectedAnimalIds.includes(item.id)}
                        onChange={(e) => handleAnimalSelect(item.id, e.target.checked)}
                        disabled={!selectedAnimalIds.includes(item.id) && selectedAnimalIds.length >= (currentRecord?.quantity || 0)}
                      >
                        <Space style={{ width: '100%' }}>
                          <Badge status={item.status === 'healthy' ? 'success' : 'default'} />
                          <Text strong>{item.name}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            #{item.id}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.species}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.gender === 'male' ? '♂' : item.gender === 'female' ? '♀' : '?'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.weight}g
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            笼位: {item.cageNumber || '-'}
                          </Text>
                        </Space>
                      </Checkbox>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 审批拒绝弹窗 */}
      <Modal
        title="审批拒绝"
        open={rejectModalVisible}
        onOk={handleConfirmReject}
        onCancel={() => setRejectModalVisible(false)}
        width={520}
        okText="确认拒绝"
        cancelText="取消"
        okType="danger"
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="approvalComment"
            label="拒绝原因"
            rules={[{ required: true, message: '请填写拒绝原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明拒绝原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsageRequestApproval;
