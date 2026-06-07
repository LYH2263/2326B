import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  InputNumber,
  DatePicker,
  TimePicker,
  Input,
  Space,
  message,
  Tag,
  Typography,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { weightApi } from '../../api';

const { Option } = Select;
const { Text } = Typography;
const { TextArea } = Input;

interface AnimalItem {
  id: number;
  name: string;
  species: string;
  breed?: string;
  gender: string;
  cageNumber?: string;
  status: string;
  lastWeight?: number | null;
  lastWeighDate?: string | null;
  weight?: number | null;
  notes?: string;
}

const QuickWeighing: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cageList, setCageList] = useState<string[]>([]);
  const [selectedCage, setSelectedCage] = useState<string | undefined>();
  const [animals, setAnimals] = useState<AnimalItem[]>([]);
  const [weighDate, setWeighDate] = useState(dayjs());
  const [weighTime, setWeighTime] = useState(dayjs());
  const [weigher, setWeigher] = useState('');
  const [deviceNo, setDeviceNo] = useState('');

  const fetchCageList = async () => {
    try {
      const res: any = await weightApi.getCageList();
      setCageList(res || []);
    } catch {
      // handled
    }
  };

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await weightApi.getAnimalsByCage(selectedCage);
      const list = (res || []).map((a: any) => ({
        ...a,
        weight: a.lastWeight || null,
        notes: '',
      }));
      setAnimals(list);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [selectedCage]);

  useEffect(() => {
    fetchCageList();
  }, []);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const handleWeightChange = (animalId: number, value: number | null) => {
    setAnimals(prev =>
      prev.map(a => (a.id === animalId ? { ...a, weight: value ?? undefined } : a))
    );
  };

  const handleNotesChange = (animalId: number, value: string) => {
    setAnimals(prev =>
      prev.map(a => (a.id === animalId ? { ...a, notes: value } : a))
    );
  };

  const handleSave = async () => {
    const itemsWithWeight = animals.filter(a => a.weight != null && a.weight > 0);

    if (itemsWithWeight.length === 0) {
      message.warning('请至少为一只动物录入体重');
      return;
    }

    try {
      setSaving(true);
      await weightApi.batchCreate({
        weighDate: weighDate.format('YYYY-MM-DD'),
        weighTime: weighTime.format('HH:mm:ss'),
        weigher: weigher || undefined,
        deviceNo: deviceNo || undefined,
        items: itemsWithWeight.map(a => ({
          animalId: a.id,
          weight: a.weight,
          notes: a.notes || undefined,
        })),
      });
      message.success(`成功保存 ${itemsWithWeight.length} 条称重记录`);
      fetchAnimals();
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setAnimals(prev => prev.map(a => ({ ...a, weight: a.lastWeight || null, notes: '' })));
    message.info('已重置为上次体重');
  };

  const getWeightDiff = (animal: AnimalItem) => {
    if (animal.weight == null || animal.lastWeight == null) return null;
    const diff = Number((animal.weight - animal.lastWeight).toFixed(2));
    return diff;
  };

  const getWeightDiffTag = (animal: AnimalItem) => {
    const diff = getWeightDiff(animal);
    if (diff === null) return null;

    if (diff > 0) {
      return (
        <Tag icon={<ArrowUpOutlined />} color="green" style={{ marginLeft: 8 }}>
          +{diff}g
        </Tag>
      );
    } else if (diff < 0) {
      return (
        <Tag icon={<ArrowDownOutlined />} color="red" style={{ marginLeft: 8 }}>
          {diff}g
        </Tag>
      );
    }
    return (
      <Tag icon={<MinusOutlined />} color="default" style={{ marginLeft: 8 }}>
        0g
      </Tag>
    );
  };

  const filledCount = animals.filter(a => a.weight != null && a.weight > 0).length;
  const totalCount = animals.length;

  const columns = [
    {
      title: '动物编号',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string, record: AnimalItem) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.species} {record.breed || ''}
          </div>
        </div>
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (g: string) => {
        const map: Record<string, string> = { male: '♂ 雄', female: '♀ 雌', unknown: '未知' };
        return <span>{map[g] || g}</span>;
      },
    },
    {
      title: '笼位',
      dataIndex: 'cageNumber',
      key: 'cageNumber',
      width: 100,
      render: (cage?: string) => cage || <Text type="secondary">未分配</Text>,
    },
    {
      title: '上次体重(g)',
      dataIndex: 'lastWeight',
      key: 'lastWeight',
      width: 130,
      render: (w?: number | null, record: AnimalItem) => (
        <div>
          {w != null ? w.toFixed(2) : <Text type="secondary">无记录</Text>}
          {record.lastWeighDate && (
            <div style={{ fontSize: 11, color: '#bbb' }}>
              {dayjs(record.lastWeighDate).format('MM-DD')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '本次体重(g)',
      key: 'weight',
      width: 180,
      render: (_: any, record: AnimalItem) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <InputNumber
            min={0}
            step={0.1}
            precision={2}
            value={record.weight ?? null}
            onChange={value => handleWeightChange(record.id, value)}
            placeholder="请输入"
            style={{ width: 120 }}
            size="middle"
          />
          {getWeightDiffTag(record)}
        </div>
      ),
    },
    {
      title: '备注',
      key: 'notes',
      width: 180,
      render: (_: any, record: AnimalItem) => (
        <Input
          value={record.notes}
          onChange={e => handleNotesChange(record.id, e.target.value)}
          placeholder="选填"
          size="small"
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* 筛选和设置区 */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col flex="200px">
            <Text strong>选择笼位：</Text>
            <Select
              placeholder="选择笼位（可选）"
              allowClear
              style={{ width: '100%', marginTop: 4 }}
              value={selectedCage}
              onChange={v => { setSelectedCage(v || undefined); }}
              showSearch
              optionFilterProp="children"
            >
              {cageList.map(cage => (
                <Option key={cage} value={cage}>{cage}</Option>
              ))}
            </Select>
          </Col>
          <Col flex="140px">
            <Text strong>称重日期：</Text>
            <DatePicker
              value={weighDate}
              onChange={d => d && setWeighDate(d)}
              style={{ width: '100%', marginTop: 4 }}
            />
          </Col>
          <Col flex="140px">
            <Text strong>称重时间：</Text>
            <TimePicker
              value={weighTime}
              onChange={t => t && setWeighTime(t)}
              format="HH:mm:ss"
              style={{ width: '100%', marginTop: 4 }}
            />
          </Col>
          <Col flex="140px">
            <Text strong>称重者：</Text>
            <Input
              value={weigher}
              onChange={e => setWeigher(e.target.value)}
              placeholder="称重者姓名"
              style={{ marginTop: 4 }}
            />
          </Col>
          <Col flex="140px">
            <Text strong>设备编号：</Text>
            <Input
              value={deviceNo}
              onChange={e => setDeviceNo(e.target.value)}
              placeholder="如 BAL-001"
              style={{ marginTop: 4 }}
            />
          </Col>
          <Col flex="auto">
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 22 }}>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置体重
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                disabled={filledCount === 0}
              >
                批量保存 ({filledCount}/{totalCount})
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 快速统计 */}
      {!loading && animals.length > 0 && (
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="动物总数"
                value={totalCount}
                suffix="只"
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="已录入"
                value={filledCount}
                suffix="只"
                valueStyle={{ fontSize: 20, color: filledCount > 0 ? '#52c41a' : undefined }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="平均体重"
                value={
                  filledCount > 0
                    ? (animals
                        .filter(a => a.weight != null && a.weight > 0)
                        .reduce((sum, a) => sum + (a.weight || 0), 0) / filledCount).toFixed(2)
                    : 0
                }
                suffix="g"
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Statistic
                title="完成进度"
                value={totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0}
                suffix="%"
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 动物列表 */}
      <Card size="small" style={{ borderRadius: 8 }} bodyStyle={{ padding: 0 }}>
        <Table
          loading={loading}
          dataSource={animals}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 800 }}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default QuickWeighing;
