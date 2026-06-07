import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card, List, Tag, Button, Form, Input, Select, InputNumber, DatePicker, Tabs,
  Space, Typography, Avatar, Badge, Divider, message, Tooltip, Spin, Empty,
} from 'antd';
import {
  CoffeeOutlined, HeartOutlined, WarningOutlined, PlusOutlined,
  LogoutOutlined, ScanOutlined, TeamOutlined, CheckCircleOutlined,
  ClockCircleOutlined, DashboardOutlined, RocketOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  statisticsApi, animalApi, feedingApi, animalTransferApi,
} from '../api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface AnimalItem {
  id: number;
  name: string;
  species: string;
  breed: string;
  cageNumber: string;
  status: string;
  rfidTag?: string;
  gender?: string;
  weight?: number;
}

interface TodoData {
  pendingFeeding: AnimalItem[];
  pendingHealthCheck: AnimalItem[];
  healthWarnings: AnimalItem[];
}

interface ProgressData {
  totalAnimals: number;
  fedCount: number;
  feedingRate: number;
  healthCheckedCount: number;
  healthRate: number;
  overallRate: number;
}

const statusColorMap: Record<string, string> = {
  healthy: 'success',
  sick: 'error',
  in_experiment: 'processing',
  quarantine: 'warning',
};

const statusLabelMap: Record<string, string> = {
  healthy: '健康',
  sick: '患病',
  in_experiment: '实验中',
  quarantine: '隔离中',
};

const Workstation: React.FC = () => {
  const [todoData, setTodoData] = useState<TodoData>({
    pendingFeeding: [],
    pendingHealthCheck: [],
    healthWarnings: [],
  });
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [cageList, setCageList] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('checkin');
  const [selectedCage, setSelectedCage] = useState<string>('');
  const [cageAnimals, setCageAnimals] = useState<AnimalItem[]>([]);
  const [batchFeedingForm] = Form.useForm();
  const [checkinForm] = Form.useForm();
  const [checkoutForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const today = dayjs().format('YYYY-MM-DD');
  const rfidInputRef = useRef<any>(null);

  const fetchTodoData = useCallback(async () => {
    try {
      const data: any = await statisticsApi.getWorkstationTodo(today);
      setTodoData(data);
    } catch (err) {
      console.error('Failed to fetch todo data:', err);
    }
  }, [today]);

  const fetchProgressData = useCallback(async () => {
    try {
      const data: any = await statisticsApi.getWorkstationProgress(today);
      setProgressData(data);
    } catch (err) {
      console.error('Failed to fetch progress data:', err);
    }
  }, [today]);

  const fetchCageList = useCallback(async () => {
    try {
      const data: any = await statisticsApi.getCageList();
      setCageList(data);
    } catch (err) {
      console.error('Failed to fetch cage list:', err);
    }
  }, []);

  const fetchAnimals = useCallback(async () => {
    try {
      const res: any = await animalApi.getList({ page: 1, pageSize: 200, status: 'healthy' });
      setAnimals(res?.list || []);
    } catch (err) {
      console.error('Failed to fetch animals:', err);
    }
  }, []);

  const fetchCageAnimals = useCallback(async (cageNumber: string) => {
    if (!cageNumber) {
      setCageAnimals([]);
      return;
    }
    try {
      const data: any = await statisticsApi.getAnimalsByCage(cageNumber);
      setCageAnimals(data || []);
      const initialValues: any = {};
      data.forEach((animal: AnimalItem) => {
        initialValues[`feed_${animal.id}`] = 20;
        initialValues[`water_${animal.id}`] = 50;
      });
      initialValues.foodType = '标准饲料';
      batchFeedingForm.setFieldsValue(initialValues);
    } catch (err) {
      console.error('Failed to fetch cage animals:', err);
    }
  }, [batchFeedingForm]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTodoData(),
        fetchProgressData(),
        fetchCageList(),
        fetchAnimals(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchTodoData, fetchProgressData, fetchCageList, fetchAnimals]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (selectedCage) {
      fetchCageAnimals(selectedCage);
    }
  }, [selectedCage, fetchCageAnimals]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setActiveTab('checkin');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('checkout');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('feeding');
            break;
          case 'r':
            e.preventDefault();
            refreshAll();
            message.info('数据已刷新');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshAll]);

  useEffect(() => {
    if (activeTab === 'checkin') {
      setTimeout(() => {
        rfidInputRef.current?.focus();
      }, 100);
    }
  }, [activeTab]);

  const handleCheckin = async () => {
    try {
      const values = await checkinForm.validateFields();
      setSubmitting(true);
      await animalApi.create(values);
      message.success('动物入库登记成功');
      checkinForm.resetFields();
      checkinForm.setFieldsValue({
        species: '小鼠',
        gender: 'unknown',
        status: 'healthy',
      });
      refreshAll();
      setTimeout(() => rfidInputRef.current?.focus(), 100);
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('登记失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    try {
      const values = await checkoutForm.validateFields();
      setSubmitting(true);
      await animalTransferApi.create({
        animalId: values.animalId,
        fromDepartment: '本实验室',
        toDepartment: values.receiver,
        transferReason: values.reason,
        transferDate: today,
        status: 'completed',
      });
      message.success('动物出库登记成功');
      checkoutForm.resetFields();
      refreshAll();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('登记失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchFeeding = async () => {
    try {
      const values = await batchFeedingForm.validateFields();
      setSubmitting(true);
      const records = cageAnimals.map(animal => ({
        animalId: animal.id,
        feedDate: today,
        feedTime: dayjs().format('HH:mm:ss'),
        foodType: values.foodType,
        quantity: values[`feed_${animal.id}`],
        unit: 'g',
        waterMl: values[`water_${animal.id}`],
        feeder: (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '{}').name) || '值班员',
      }));
      await Promise.all(records.map(r => feedingApi.create(r)));
      message.success(`成功记录 ${cageAnimals.length} 条喂养记录`);
      refreshAll();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTodoItem = (item: AnimalItem, type: string) => (
    <List.Item
      key={`${type}-${item.id}`}
      style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
        <Avatar
          size={36}
          style={{
            background: type === 'feeding' ? '#059669' : type === 'health' ? '#4f46e5' : '#f59e0b',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {item.name?.charAt(0) || 'A'}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong style={{ fontSize: 13 }}>{item.name}</Text>
            <Tag color={statusColorMap[item.status]} style={{ fontSize: 10, padding: '0 6px' }}>
              {statusLabelMap[item.status] || item.status}
            </Tag>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {item.species} · {item.cageNumber || '无笼位'}
            </Text>
          </div>
        </div>
      </div>
    </List.Item>
  );

  const renderProgressRing = (percent: number, color: string, label: string, subtext: string) => {
    const radius = 50;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#f0f0f0"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{percent}%</div>
          </div>
        </div>
        <Text strong style={{ display: 'block', marginTop: 8, fontSize: 13 }}>{label}</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>{subtext}</Text>
      </div>
    );
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 112px)' }}>
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a78bfa 100%)',
          border: 'none',
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={16}>
            <div>
              <Title level={4} style={{ color: '#fff', margin: 0 }}>
                🐾 登记工作站
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                值班人员集中操作平台 · {dayjs().format('YYYY年MM月DD日 dddd')}
              </Text>
            </div>
          </Space>
          <Space>
            <Tooltip title="刷新数据 (Ctrl+R)">
              <Button
                icon={<RocketOutlined />}
                onClick={refreshAll}
                loading={loading}
                style={{ borderRadius: 8 }}
              >
                刷新
              </Button>
            </Tooltip>
            <Tag color="#10b981" icon={<CheckCircleOutlined />} style={{ borderRadius: 12, padding: '2px 12px' }}>
              系统运行正常
            </Tag>
          </Space>
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 300px',
          gap: 16,
          minHeight: 'calc(100vh - 200px)',
        }}
      >
        {/* 左侧：今日待办 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card
            size="small"
            title={
              <Space size={8}>
                <CoffeeOutlined style={{ color: '#059669' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>待喂养</span>
                <Badge count={todoData.pendingFeeding.length} size="small" style={{ backgroundColor: '#059669' }} />
              </Space>
            }
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: '8px 12px', maxHeight: 220, overflow: 'auto' }}
          >
            {todoData.pendingFeeding.length > 0 ? (
              <List
                size="small"
                dataSource={todoData.pendingFeeding.slice(0, 8)}
                renderItem={(item) => renderTodoItem(item, 'feeding')}
              />
            ) : (
              <Empty description="全部完成" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '20px 0' }} />
            )}
            {todoData.pendingFeeding.length > 8 && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  还有 {todoData.pendingFeeding.length - 8} 只待喂养
                </Text>
              </div>
            )}
          </Card>

          <Card
            size="small"
            title={
              <Space size={8}>
                <HeartOutlined style={{ color: '#4f46e5' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>待体检</span>
                <Badge count={todoData.pendingHealthCheck.length} size="small" style={{ backgroundColor: '#4f46e5' }} />
              </Space>
            }
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: '8px 12px', maxHeight: 220, overflow: 'auto' }}
          >
            {todoData.pendingHealthCheck.length > 0 ? (
              <List
                size="small"
                dataSource={todoData.pendingHealthCheck.slice(0, 8)}
                renderItem={(item) => renderTodoItem(item, 'health')}
              />
            ) : (
              <Empty description="全部完成" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '20px 0' }} />
            )}
            {todoData.pendingHealthCheck.length > 8 && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  还有 {todoData.pendingHealthCheck.length - 8} 只待体检
                </Text>
              </div>
            )}
          </Card>

          <Card
            size="small"
            title={
              <Space size={8}>
                <WarningOutlined style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>健康预警</span>
                <Badge count={todoData.healthWarnings.length} size="small" />
              </Space>
            }
            style={{ borderRadius: 10, borderColor: '#fde68a' }}
            bodyStyle={{ padding: '8px 12px', maxHeight: 220, overflow: 'auto' }}
          >
            {todoData.healthWarnings.length > 0 ? (
              <List
                size="small"
                dataSource={todoData.healthWarnings.slice(0, 8)}
                renderItem={(item) => renderTodoItem(item, 'warning')}
              />
            ) : (
              <Empty description="暂无预警" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '20px 0' }} />
            )}
          </Card>
        </div>

        {/* 中部：快捷操作 */}
        <Card
          style={{ borderRadius: 10 }}
          bodyStyle={{ padding: 0 }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            style={{ padding: '0 16px' }}
            items={[
              {
                key: 'checkin',
                label: (
                  <span style={{ fontSize: 14 }}>
                    <PlusOutlined style={{ marginRight: 6 }} />
                    新入库登记
                    <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>Ctrl+1</Tag>
                  </span>
                ),
                children: (
                  <div style={{ padding: '8px 24px 24px' }}>
                    <Form
                      form={checkinForm}
                      layout="vertical"
                      initialValues={{
                        species: '小鼠',
                        gender: 'unknown',
                        status: 'healthy',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item
                          name="rfidTag"
                          label={
                            <Space>
                              <ScanOutlined style={{ color: '#4f46e5' }} />
                              <span>RFID 标签</span>
                              <Tag color="green" style={{ fontSize: 10 }}>扫码</Tag>
                            </Space>
                          }
                          rules={[{ required: true, message: '请输入RFID标签' }]}
                        >
                          <Input
                            ref={rfidInputRef}
                            placeholder="扫描或输入RFID标签"
                            size="large"
                            style={{ fontWeight: 600 }}
                          />
                        </Form.Item>

                        <Form.Item
                          name="name"
                          label="动物编号/名称"
                          rules={[{ required: true, message: '请输入动物编号' }]}
                        >
                          <Input placeholder="如：M-001" size="large" />
                        </Form.Item>

                        <Form.Item
                          name="species"
                          label="物种"
                          rules={[{ required: true, message: '请选择物种' }]}
                        >
                          <Select size="large">
                            <Option value="小鼠">小鼠</Option>
                            <Option value="大鼠">大鼠</Option>
                            <Option value="兔">兔</Option>
                            <Option value="豚鼠">豚鼠</Option>
                            <Option value="其他">其他</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item name="breed" label="品系">
                          <Input placeholder="如：C57BL/6" size="large" />
                        </Form.Item>

                        <Form.Item name="gender" label="性别">
                          <Select size="large">
                            <Option value="male">雄性</Option>
                            <Option value="female">雌性</Option>
                            <Option value="unknown">未知</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item name="birthDate" label="出生日期">
                          <DatePicker style={{ width: '100%' }} size="large" />
                        </Form.Item>

                        <Form.Item name="weight" label="体重(g)">
                          <InputNumber min={0} step={0.1} style={{ width: '100%' }} size="large" />
                        </Form.Item>

                        <Form.Item name="cageNumber" label="笼位编号">
                          <Input placeholder="如：A-01" size="large" />
                        </Form.Item>

                        <Form.Item name="source" label="来源">
                          <Input placeholder="供应商/繁育中心" size="large" />
                        </Form.Item>

                        <Form.Item name="status" label="初始状态">
                          <Select size="large">
                            <Option value="healthy">健康</Option>
                            <Option value="quarantine">隔离中</Option>
                          </Select>
                        </Form.Item>
                      </div>

                      <Form.Item name="description" label="备注说明">
                        <TextArea rows={2} placeholder="其他需要记录的信息" />
                      </Form.Item>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <Button size="large" onClick={() => checkinForm.resetFields()}>
                          重置
                        </Button>
                        <Button
                          type="primary"
                          size="large"
                          icon={<PlusOutlined />}
                          onClick={handleCheckin}
                          loading={submitting}
                          style={{ minWidth: 120 }}
                        >
                          确认入库
                        </Button>
                      </div>
                    </Form>
                  </div>
                ),
              },
              {
                key: 'checkout',
                label: (
                  <span style={{ fontSize: 14 }}>
                    <LogoutOutlined style={{ marginRight: 6 }} />
                    出库登记
                    <Tag color="orange" style={{ marginLeft: 8, fontSize: 10 }}>Ctrl+2</Tag>
                  </span>
                ),
                children: (
                  <div style={{ padding: '8px 24px 24px' }}>
                    <Form
                      form={checkoutForm}
                      layout="vertical"
                    >
                      <Form.Item
                        name="animalId"
                        label="选择动物"
                        rules={[{ required: true, message: '请选择出库动物' }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="children"
                          placeholder="搜索或选择动物"
                          size="large"
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {animals.map(animal => (
                            <Option key={animal.id} value={animal.id}>
                              {animal.name} ({animal.species} - {animal.cageNumber || '无笼位'})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item
                          name="reason"
                          label="出库原因"
                          rules={[{ required: true, message: '请选择出库原因' }]}
                        >
                          <Select size="large">
                            <Option value="实验使用">实验使用</Option>
                            <Option value="转移/借调">转移/借调</Option>
                            <Option value="死亡处理">死亡处理</Option>
                            <Option value="退供应商">退供应商</Option>
                            <Option value="其他">其他</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item
                          name="receiver"
                          label="接收方/去向"
                          rules={[{ required: true, message: '请输入接收方' }]}
                        >
                          <Input placeholder="如：药理实验室" size="large" />
                        </Form.Item>

                        <Form.Item name="transferDate" label="出库日期">
                          <DatePicker
                            style={{ width: '100%' }}
                            size="large"
                            defaultValue={dayjs()}
                          />
                        </Form.Item>

                        <Form.Item name="operator" label="经办人">
                          <Input placeholder="经办人姓名" size="large" />
                        </Form.Item>
                      </div>

                      <Form.Item name="notes" label="备注">
                        <TextArea rows={3} placeholder="其他需要说明的情况" />
                      </Form.Item>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <Button size="large" onClick={() => checkoutForm.resetFields()}>
                          重置
                        </Button>
                        <Button
                          type="primary"
                          danger
                          size="large"
                          icon={<LogoutOutlined />}
                          onClick={handleCheckout}
                          loading={submitting}
                          style={{ minWidth: 120 }}
                        >
                          确认出库
                        </Button>
                      </div>
                    </Form>
                  </div>
                ),
              },
              {
                key: 'feeding',
                label: (
                  <span style={{ fontSize: 14 }}>
                    <CoffeeOutlined style={{ marginRight: 6 }} />
                    快速喂养
                    <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>Ctrl+3</Tag>
                  </span>
                ),
                children: (
                  <div style={{ padding: '8px 24px 24px' }}>
                    <Form form={batchFeedingForm} layout="vertical">
                      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 200px', gap: 16, marginBottom: 16 }}>
                        <Form.Item
                          name="cageSelect"
                          label="选择笼位"
                          rules={[{ required: true, message: '请选择笼位' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder="选择笼位"
                            size="large"
                            showSearch
                            value={selectedCage}
                            onChange={(v) => setSelectedCage(v)}
                            filterOption={(input, option) =>
                              (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                            options={cageList.map(c => ({
                              label: `${c.cageNumber} (${c.animalCount}只)`,
                              value: c.cageNumber,
                            }))}
                          />
                        </Form.Item>

                        <Form.Item
                          name="foodType"
                          label="饲料类型"
                          rules={[{ required: true, message: '请输入饲料类型' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="如：标准啮齿类动物饲料" size="large" />
                        </Form.Item>

                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <Button
                            type="primary"
                            size="large"
                            icon={<CheckCircleOutlined />}
                            onClick={handleBatchFeeding}
                            loading={submitting}
                            disabled={!selectedCage || cageAnimals.length === 0}
                            style={{ width: '100%' }}
                          >
                            一键保存 ({cageAnimals.length}只)
                          </Button>
                        </div>
                      </div>

                      <Divider style={{ margin: '8px 0 16px' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          笼内动物列表 · 共 {cageAnimals.length} 只
                        </Text>
                      </Divider>

                      {cageAnimals.length > 0 ? (
                        <div
                          style={{
                            maxHeight: 320,
                            overflow: 'auto',
                            marginBottom: 16,
                          }}
                        >
                          {cageAnimals.map((animal, index) => (
                            <div
                              key={animal.id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 1fr 120px 120px',
                                gap: 12,
                                alignItems: 'center',
                                padding: '10px 12px',
                                background: index % 2 === 0 ? '#fafafa' : '#fff',
                                borderRadius: 8,
                                marginBottom: 4,
                              }}
                            >
                              <Avatar
                                size={32}
                                style={{
                                  background: '#059669',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {animal.name?.charAt(0) || 'A'}
                              </Avatar>
                              <div>
                                <Text strong style={{ fontSize: 13 }}>{animal.name}</Text>
                                <div>
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {animal.species} · {animal.gender === 'male' ? '♂' : animal.gender === 'female' ? '♀' : '?'}
                                    {animal.weight && ` · ${animal.weight}g`}
                                  </Text>
                                </div>
                              </div>
                              <Form.Item
                                name={`feed_${animal.id}`}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber
                                  min={0}
                                  step={1}
                                  addonAfter="g"
                                  style={{ width: '100%' }}
                                  size="small"
                                />
                              </Form.Item>
                              <Form.Item
                                name={`water_${animal.id}`}
                                style={{ marginBottom: 0 }}
                              >
                                <InputNumber
                                  min={0}
                                  step={5}
                                  addonAfter="ml"
                                  style={{ width: '100%' }}
                                  size="small"
                                />
                              </Form.Item>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Empty
                          description={selectedCage ? '该笼位暂无动物' : '请先选择笼位'}
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          style={{ padding: '40px 0' }}
                        />
                      )}
                    </Form>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* 右侧：动态概览 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card
            style={{ borderRadius: 10 }}
            title={
              <Space size={8}>
                <DashboardOutlined style={{ color: '#7c3aed' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>今日完成率</span>
              </Space>
            }
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {renderProgressRing(
                progressData?.overallRate || 0,
                '#7c3aed',
                '总体完成率',
                `${progressData?.fedCount || 0} + ${progressData?.healthCheckedCount || 0} 项操作`
              )}
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {renderProgressRing(
                progressData?.feedingRate || 0,
                '#059669',
                '喂养完成',
                `${progressData?.fedCount || 0}/${progressData?.totalAnimals || 0}`
              )}
              {renderProgressRing(
                progressData?.healthRate || 0,
                '#4f46e5',
                '体检完成',
                `${progressData?.healthCheckedCount || 0}/${progressData?.totalAnimals || 0}`
              )}
            </div>
          </Card>

          <Card
            style={{ borderRadius: 10 }}
            title={
              <Space size={8}>
                <TeamOutlined style={{ color: '#059669' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>快捷统计</span>
              </Space>
            }
            bodyStyle={{ padding: '8px 16px 16px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>今日已喂养</Text>
                <Text strong style={{ color: '#059669' }}>
                  {progressData?.fedCount || 0} 只
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>今日待喂养</Text>
                <Text strong>
                  {(progressData?.totalAnimals || 0) - (progressData?.fedCount || 0)} 只
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>今日已体检</Text>
                <Text strong style={{ color: '#4f46e5' }}>
                  {progressData?.healthCheckedCount || 0} 只
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>健康预警</Text>
                <Text strong style={{ color: '#f59e0b' }}>
                  {todoData.healthWarnings.length} 只
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>在库动物总数</Text>
                <Text strong>
                  {progressData?.totalAnimals || 0} 只
                </Text>
              </div>
            </div>
          </Card>

          <Card
            style={{ borderRadius: 10 }}
            title={
              <Space size={8}>
                <ClockCircleOutlined style={{ color: '#ea580c' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>快捷键提示</span>
              </Space>
            }
            bodyStyle={{ padding: '8px 16px 16px' }}
            size="small"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={8}>
                  <Tag color="blue">Ctrl + 1</Tag>
                  <Text style={{ fontSize: 12 }}>切换到入库登记</Text>
                </Space>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={8}>
                  <Tag color="orange">Ctrl + 2</Tag>
                  <Text style={{ fontSize: 12 }}>切换到出库登记</Text>
                </Space>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={8}>
                  <Tag color="green">Ctrl + 3</Tag>
                  <Text style={{ fontSize: 12 }}>切换到快速喂养</Text>
                </Space>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={8}>
                  <Tag color="purple">Ctrl + R</Tag>
                  <Text style={{ fontSize: 12 }}>刷新所有数据</Text>
                </Space>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Workstation;
