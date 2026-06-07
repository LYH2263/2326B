import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Empty,
  Spin,
  Alert,
  Tooltip,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Box } from '@ant-design/plots';
import { weightApi, animalApi } from '../../api';

const { Option } = Select;
const { Title, Text } = Typography;

const WeightAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [selectedBreed, setSelectedBreed] = useState<string>('');
  const [breedList, setBreedList] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  const fetchSpecies = async () => {
    try {
      const res: any = await animalApi.getSpecies();
      const list = res || [];
      setSpeciesList(list);
      if (list.length > 0) {
        setSelectedSpecies(list[0]);
      }
    } catch {
      // handled
    }
  };

  const fetchBreeds = async (species: string) => {
    try {
      const res: any = await animalApi.getList({ species, page: 1, pageSize: 200 });
      const animals = res?.list || [];
      const breeds = Array.from(new Set(animals.map((a: any) => a.breed).filter(Boolean))) as string[];
      setBreedList(breeds);
      setSelectedBreed('');
    } catch {
      // handled
    }
  };

  const fetchStatistics = useCallback(async () => {
    if (!selectedSpecies && !selectedBreed) {
      setStatistics(null);
      return;
    }

    try {
      setLoading(true);
      const params: any = {};
      if (selectedSpecies) params.species = selectedSpecies;
      if (selectedBreed) params.breed = selectedBreed;

      const res: any = await weightApi.getGroupStatistics(params);
      setStatistics(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [selectedSpecies, selectedBreed]);

  useEffect(() => {
    fetchSpecies();
  }, []);

  useEffect(() => {
    if (selectedSpecies) {
      fetchBreeds(selectedSpecies);
    } else {
      setBreedList([]);
      setSelectedBreed('');
    }
  }, [selectedSpecies]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // 箱线图数据
  const boxData = useMemo(() => {
    if (!statistics || statistics.count === 0) return [];
    return [
      {
        x: selectedBreed || selectedSpecies || '总体',
        low: statistics.min,
        q1: statistics.q1,
        median: statistics.median,
        q3: statistics.q3,
        high: statistics.max,
      },
    ];
  }, [statistics, selectedSpecies, selectedBreed]);

  // 正态分布曲线数据
  const normalDistributionData = useMemo(() => {
    if (!statistics || statistics.count < 3 || statistics.stdDev === 0) return [];

    const { mean, stdDev, min, max } = statistics;
    const data: any[] = [];
    const range = max - min;
    const step = range / 50;

    for (let x = min - range * 0.1; x <= max + range * 0.1; x += step) {
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
      data.push({
        weight: Number(x.toFixed(2)),
        density: Number(y.toFixed(6)),
        type: '正态分布',
      });
    }

    return data;
  }, [statistics]);

  // 直方图数据
  const histogramData = useMemo(() => {
    if (!statistics?.distribution) return [];
    return statistics.distribution.map((d: any) => ({
      weight: d.label,
      count: d.count,
      percentage: d.percentage,
      type: '实际分布',
    }));
  }, [statistics]);

  // 离群点列表列
  const outlierColumns = [
    {
      title: '动物编号',
      dataIndex: 'animal',
      key: 'animal',
      render: (_: any, record: any) => {
        const animal = statistics?.weights?.find((w: any) => w.animalId === record.animalId);
        return animal?.name || `#${record.animalId}`;
      },
    },
    {
      title: '体重(g)',
      dataIndex: 'weight',
      key: 'weight',
      render: (w: number) => <Text strong style={{ color: '#ff4d4f' }}>{Number(w).toFixed(2)}</Text>,
    },
    {
      title: '偏离程度',
      key: 'deviation',
      render: (_: any, record: any) => {
        const diff = Math.abs(Number(record.weight) - (statistics?.mean || 0));
        const sdAway = statistics?.stdDev ? (diff / statistics.stdDev).toFixed(2) : '0';
        return <Tag color="red">偏离均值 {sdAway} SD</Tag>;
      },
    },
    {
      title: '判定',
      key: 'status',
      render: () => (
        <Tag icon={<WarningOutlined />} color="red">
          异常离群点
        </Tag>
      ),
    },
  ];

  const boxConfig = {
    data: boxData,
    xField: 'x',
    yField: ['low', 'q1', 'median', 'q3', 'high'],
    boxStyle: {
      fill: '#1677ff',
      stroke: '#0958d9',
      lineWidth: 1,
    },
    columnWidthRatio: 0.3,
    yAxis: {
      label: {
        formatter: (v: any) => `${v}g`,
      },
      title: {
        text: '体重 (g)',
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: '箱线图',
          value: `最小值: ${datum.low}g / Q1: ${datum.q1}g / 中位数: ${datum.median}g / Q3: ${datum.q3}g / 最大值: ${datum.high}g`,
        };
      },
    },
  };

  const normalConfig = {
    data: normalDistributionData,
    xField: 'weight',
    yField: 'density',
    seriesField: 'type',
    smooth: true,
    lineStyle: {
      stroke: '#52c41a',
      lineWidth: 2,
      lineDash: [5, 5],
    },
    point: {
      size: 0,
    },
    yAxis: {
      title: {
        text: '概率密度',
      },
    },
    xAxis: {
      label: {
        formatter: (v: any) => `${v}g`,
      },
      title: {
        text: '体重 (g)',
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: datum.type,
          value: `体重: ${datum.weight}g, 密度: ${datum.density}`,
        };
      },
    },
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* 筛选区 */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col>
            <Text strong>物种：</Text>
            <Select
              placeholder="选择物种"
              style={{ width: 140, marginLeft: 8 }}
              value={selectedSpecies || undefined}
              onChange={v => setSelectedSpecies(v || '')}
              allowClear
            >
              {speciesList.map(s => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Text strong>品系：</Text>
            <Select
              placeholder="全部品系"
              style={{ width: 140, marginLeft: 8 }}
              value={selectedBreed || undefined}
              onChange={v => setSelectedBreed(v || '')}
              allowClear
              disabled={!selectedSpecies || breedList.length === 0}
            >
              {breedList.map(b => (
                <Option key={b} value={b}>{b}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spin size="large" tip="加载统计数据中..." />
        </div>
      ) : !statistics || statistics.count === 0 ? (
        <Empty
          description="暂无体重数据"
          style={{ padding: '60px 0' }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* 统计概览卡片 */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="样本数量"
                  value={statistics.count}
                  suffix="只"
                  valueStyle={{ fontSize: 22, color: '#1677ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="平均体重 (±SD)"
                  value={`${statistics.mean} ± ${statistics.stdDev}`}
                  suffix="g"
                  valueStyle={{ fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="中位数"
                  value={statistics.median}
                  suffix="g"
                  valueStyle={{ fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="最小值 / 最大值"
                  value={`${statistics.min} / ${statistics.max}`}
                  suffix="g"
                  valueStyle={{ fontSize: 16 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="四分位距 (IQR)"
                  value={statistics.iqr}
                  suffix="g"
                  valueStyle={{ fontSize: 18, color: '#7c3aed' }}
                  prefix={<InfoCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small" style={{ borderRadius: 8 }}>
                <Statistic
                  title="离群点数量"
                  value={statistics.outliers?.length || 0}
                  suffix="只"
                  valueStyle={{
                    fontSize: 22,
                    color: statistics.outliers?.length > 0 ? '#ff4d4f' : '#52c41a',
                  }}
                  prefix={
                    statistics.outliers?.length > 0
                      ? <WarningOutlined />
                      : <CheckCircleOutlined />
                  }
                />
              </Card>
            </Col>
          </Row>

          {/* 图表区域 */}
          <Row gutter={[16, 16]}>
            {/* 箱线图 */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <span>体重箱线图</span>
                    <Tag color="blue">Box Plot</Tag>
                  </Space>
                }
                style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                size="small"
              >
                <div style={{ height: 300 }}>
                  {boxData.length > 0 && <Box {...boxConfig} />}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: '#999', padding: '0 8px' }}>
                  <div>• Q1: {statistics.q1}g（第一四分位数）</div>
                  <div>• 中位数: {statistics.median}g</div>
                  <div>• Q3: {statistics.q3}g（第三四分位数）</div>
                  <div>• IQR: {statistics.iqr}g（四分位距）</div>
                  <div>• 异常值范围: &lt; {statistics.lowerFence}g 或 &gt; {statistics.upperFence}g</div>
                </div>
              </Card>
            </Col>

            {/* 正态分布曲线 */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <span>体重分布</span>
                    <Tag color="green">正态分布曲线</Tag>
                  </Space>
                }
                style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                size="small"
              >
                <div style={{ height: 300 }}>
                  {normalDistributionData.length > 0 && (
                    <div style={{ position: 'relative', height: '100%' }}>
                      {/* 柱状图（实际分布） */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        height: 220,
                        padding: '20px 0',
                        gap: 2,
                      }}>
                        {histogramData.map((d: any, i: number) => {
                          const maxCount = Math.max(...histogramData.map((x: any) => x.count));
                          const height = maxCount > 0 ? (d.count / maxCount) * 200 : 0;
                          return (
                            <Tooltip title={`${d.weight}g: ${d.count}只 (${d.percentage}%)`} key={i}>
                              <div
                                style={{
                                  flex: 1,
                                  minWidth: 20,
                                  background: 'linear-gradient(180deg, #91caff 0%, #1677ff 100%)',
                                  height: `${height}px`,
                                  borderRadius: '2px 2px 0 0',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </div>
                      {/* 正态分布曲线 */}
                      {normalDistributionData.length > 0 && (
                        <div style={{ position: 'absolute', top: 20, left: 0, right: 0, bottom: 60, pointerEvents: 'none' }}>
                          <svg
                            width="100%"
                            height="100%"
                            viewBox={`0 0 100 100`}
                            preserveAspectRatio="none"
                            style={{ position: 'absolute', top: 0, left: 0 }}
                          >
                            <path
                              d={(() => {
                                const maxY = Math.max(...normalDistributionData.map(d => d.density));
                                const minX = Math.min(...normalDistributionData.map(d => d.weight));
                                const maxX = Math.max(...normalDistributionData.map(d => d.weight));
                                const rangeX = maxX - minX;

                                const points = normalDistributionData.map(d => {
                                  const x = ((d.weight - minX) / rangeX) * 100;
                                  const y = 100 - (d.density / maxY) * 100;
                                  return `${x},${y}`;
                                });
                                return `M${points.join(' L')}`;
                              })()}
                              fill="none"
                              stroke="#52c41a"
                              strokeWidth="0.8"
                              strokeDasharray="2,1"
                            />
                          </svg>
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 10,
                        color: '#999',
                        padding: '0 4px',
                      }}>
                        <span>{statistics.min}g</span>
                        <span>{statistics.mean}g (均值)</span>
                        <span>{statistics.max}g</span>
                      </div>
                    </div>
                  )}
                </div>
                <Alert
                  message="均值 ± SD 区间"
                  description={`${(statistics.mean - statistics.stdDev).toFixed(2)}g ~ ${(statistics.mean + statistics.stdDev).toFixed(2)}g (±1 SD)`}
                  type="info"
                  showIcon
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
          </Row>

          {/* 离群点列表 */}
          {statistics.outliers && statistics.outliers.length > 0 && (
            <Card
              title={
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  <span>异常离群点</span>
                  <Tag color="red">{statistics.outliers.length} 只</Tag>
                </Space>
              }
              style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              size="small"
            >
              <Alert
                message="以下动物体重偏离正常范围，建议重点关注"
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
              />
              <Table
                dataSource={statistics.outliers}
                columns={outlierColumns}
                rowKey="animalId"
                size="small"
                pagination={false}
              />
            </Card>
          )}

          {/* 分布区间表 */}
          <Card
            title="体重分布区间"
            style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            size="small"
          >
            <Row gutter={[8, 8]}>
              {(statistics.distribution || []).map((d: any, i: number) => (
                <Col xs={12} sm={8} md={6} key={i}>
                  <div style={{
                    padding: '12px 16px',
                    background: '#f0f5ff',
                    borderRadius: 8,
                    textAlign: 'center',
                    border: '1px solid #d6e4ff',
                  }}>
                    <Text strong style={{ fontSize: 16, color: '#1677ff' }}>{d.count}</Text>
                    <Text type="secondary" style={{ marginLeft: 4, fontSize: 12 }}>只</Text>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{d.label}g</div>
                    <div style={{ fontSize: 11, color: '#999' }}>占比 {d.percentage}%</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </>
      )}
    </div>
  );
};

export default WeightAnalysis;
