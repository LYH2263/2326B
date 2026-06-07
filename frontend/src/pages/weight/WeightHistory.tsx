import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Modal,
  Form,
  InputNumber,
  TimePicker,
  Popconfirm,
  message,
  Tooltip,
  Typography,
  Tag,
  Descriptions,
  Drawer,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { weightApi, animalApi } from '../../api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;
const { TextArea } = Input;

const WeightHistory: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [animalFilter, setAnimalFilter] = useState<number | undefined>();
  const [cageFilter, setCageFilter] = useState<string | undefined>();
  const [speciesFilter, setSpeciesFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [weigherFilter, setWeigherFilter] = useState('');
  const [animals, setAnimals] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [cageList, setCageList] = useState<string[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [growthRate, setGrowthRate] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        pageSize,
      };
      if (animalFilter) params.animalId = animalFilter;
      if (cageFilter) params.cageNumber = cageFilter;
      if (speciesFilter) params.species = speciesFilter;
      if (weigherFilter) params.weigher = weigherFilter;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const res: any = await weightApi.getList(params);
      setData(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, animalFilter, cageFilter, speciesFilter, dateRange, weigherFilter]);

  const fetchAnimals = async () => {
    try {
      const res: any = await animalApi.getList({ page: 1, pageSize: 200 });
      setAnimals(res?.list || []);
    } catch {
      // handled
    }
  };

  const fetchSpecies = async () => {
    try {
      const res: any = await animalApi.getSpecies();
      setSpeciesList(res || []);
    } catch {
      // handled
    }
  };

  const fetchCages = async () => {
    try {
      const res: any = await weightApi.getCageList();
      setCageList(res || []);
    } catch {
      // handled
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchAnimals();
    fetchSpecies();
    fetchCages();
  }, []);

  const handleEdit = async (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      weighDate: record.weighDate ? dayjs(record.weighDate) : null,
      weighTime: record.weighTime ? dayjs(record.weighTime, 'HH:mm:ss') : null,
    });
    setModalVisible(true);
  };

  const handleView = async (record: any) => {
    setDetailRecord(record);
    try {
      const res: any = await weightApi.getGrowthRate(record.animalId);
      setGrowthRate(res);
    } catch {
      setGrowthRate(null);
    }
    setDetailVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await weightApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch {
      // handled
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        weighDate: values.weighDate?.format('YYYY-MM-DD'),
        weighTime: values.weighTime?.format('HH:mm:ss'),
      };

      if (editingRecord) {
        await weightApi.update(editingRecord.id, payload);
        message.success('更新成功');
      } else {
        await weightApi.create(payload);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchData();
    } catch {
      // handled
    }
  };

  const handleReset = () => {
    setAnimalFilter(undefined);
    setCageFilter(undefined);
    setSpeciesFilter(undefined);
    setDateRange([]);
    setWeigherFilter('');
    setPage(1);
  };

  const columns = [
    {
      title: '动物信息',
      key: 'animal',
      width: 180,
      render: (_: any, record: any) => (
        <div>
          <Text strong>{record.animal?.name || `#${record.animalId}`}</Text>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.animal?.species || ''} {record.animal?.breed || ''}
          </div>
          {record.animal?.cageNumber && (
            <Tag color="blue" style={{ marginTop: 4, fontSize: 11 }}>
              {record.animal.cageNumber}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '称重日期',
      dataIndex: 'weighDate',
      key: 'weighDate',
      width: 110,
      render: (d: string) => d ? dayjs(d).format('YYYY-MM-DD') : '-',
    },
    {
      title: '时间',
      dataIndex: 'weighTime',
      key: 'weighTime',
      width: 90,
      render: (t: string) => t || '-',
    },
    {
      title: '体重(g)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      render: (w: number) => w != null ? Number(w).toFixed(2) : '-',
      sorter: (a: any, b: any) => Number(a.weight) - Number(b.weight),
    },
    {
      title: '称重者',
      dataIndex: 'weigher',
      key: 'weigher',
      width: 90,
      render: (w: string) => w || '-',
    },
    {
      title: '设备编号',
      dataIndex: 'deviceNo',
      key: 'deviceNo',
      width: 100,
      render: (d: string) => d || '-',
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (n: string) => n || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* 筛选区 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Select
          placeholder="选择动物"
          allowClear
          showSearch
          optionFilterProp="children"
          style={{ width: 180 }}
          value={animalFilter}
          onChange={v => { setAnimalFilter(v); setPage(1); }}
        >
          {animals.map(a => (
            <Option key={a.id} value={a.id}>
              {a.name} ({a.species})
            </Option>
          ))}
        </Select>
        <Select
          placeholder="选择物种"
          allowClear
          style={{ width: 140 }}
          value={speciesFilter}
          onChange={v => { setSpeciesFilter(v || undefined); setPage(1); }}
        >
          {speciesList.map(s => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Select>
        <Select
          placeholder="选择笼位"
          allowClear
          showSearch
          optionFilterProp="children"
          style={{ width: 140 }}
          value={cageFilter}
          onChange={v => { setCageFilter(v || undefined); setPage(1); }}
        >
          {cageList.map(c => (
            <Option key={c} value={c}>{c}</Option>
          ))}
        </Select>
        <RangePicker
          value={dateRange.length > 0 ? dateRange : null as any}
          onChange={dates => { setDateRange(dates || []); setPage(1); }}
          style={{ width: 260 }}
        />
        <Input
          placeholder="称重者"
          allowClear
          style={{ width: 130 }}
          value={weigherFilter}
          onChange={e => setWeigherFilter(e.target.value)}
          onPressEnter={() => setPage(1)}
        />
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
      </div>

      {/* 列表 */}
      <Table
        loading={loading}
        dataSource={data}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: t => `共 ${t} 条记录`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      {/* 编辑 Modal */}
      <Modal
        title={editingRecord ? '编辑称重记录' : '添加称重记录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={560}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="animalId" label="动物" rules={[{ required: true, message: '请选择动物' }]}>
              <Select showSearch optionFilterProp="children" placeholder="选择动物" disabled={!!editingRecord}>
                {animals.map(a => (
                  <Option key={a.id} value={a.id} disabled={a.status === 'deceased'}>
                    {a.name} ({a.species}) {a.status === 'deceased' && '- 已死亡'}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="weighDate" label="称重日期" rules={[{ required: true, message: '请选择日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="weighTime" label="称重时间">
              <TimePicker style={{ width: '100%' }} format="HH:mm:ss" />
            </Form.Item>
            <Form.Item name="weight" label="体重(g)" rules={[{ required: true, message: '请输入体重' }]}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} precision={2} />
            </Form.Item>
            <Form.Item name="weigher" label="称重者">
              <Input placeholder="称重者姓名" />
            </Form.Item>
            <Form.Item name="deviceNo" label="设备编号">
              <Input placeholder="如 BAL-001" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} placeholder="其他备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 Drawer */}
      <Drawer
        title="称重记录详情"
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        width={420}
      >
        {detailRecord && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="动物">
                {detailRecord.animal?.name || `#${detailRecord.animalId}`}
              </Descriptions.Item>
              <Descriptions.Item label="物种/品系">
                {detailRecord.animal?.species || '-'} {detailRecord.animal?.breed || ''}
              </Descriptions.Item>
              <Descriptions.Item label="笼位">
                {detailRecord.animal?.cageNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="称重日期">
                {detailRecord.weighDate ? dayjs(detailRecord.weighDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="称重时间">
                {detailRecord.weighTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="体重">
                <Text strong style={{ fontSize: 16, color: '#1677ff' }}>
                  {Number(detailRecord.weight).toFixed(2)} g
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="称重者">
                {detailRecord.weigher || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="设备编号">
                {detailRecord.deviceNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注">
                {detailRecord.notes || '-'}
              </Descriptions.Item>
            </Descriptions>

            {growthRate && (
              <>
                <div style={{ marginTop: 20, marginBottom: 12 }}>
                  <Text strong>体重增长情况</Text>
                </div>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="上次体重"
                        value={growthRate.previousWeight || 0}
                        suffix="g"
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="本次体重"
                        value={growthRate.latestWeight}
                        suffix="g"
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="体重变化"
                        value={growthRate.weightChange}
                        suffix="g"
                        valueStyle={{
                          fontSize: 16,
                          color: growthRate.weightChange >= 0 ? '#52c41a' : '#ff4d4f',
                        }}
                        prefix={growthRate.weightChange > 0 ? <ArrowUpOutlined /> : growthRate.weightChange < 0 ? <ArrowDownOutlined /> : <MinusOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="增长率"
                        value={growthRate.growthRate}
                        suffix="%"
                        valueStyle={{
                          fontSize: 16,
                          color: growthRate.growthRate >= 0 ? '#52c41a' : '#ff4d4f',
                        }}
                        prefix={growthRate.growthRate > 0 ? <ArrowUpOutlined /> : growthRate.growthRate < 0 ? <ArrowDownOutlined /> : <MinusOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>
                <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                  距上次称重 {growthRate.daysBetween} 天，日均增长率 {growthRate.dailyGrowthRate}%
                </div>
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
};

export default WeightHistory;
