import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Button,
  Space,
  Tag,
  Typography,
  List,
  Pagination,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  ImportOutlined,
  ExportOutlined,
  EditOutlined,
  PlusOutlined,
  MinusOutlined,
  EditFilled,
  ExperimentOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Line } from '@ant-design/plots';
import { inventoryApi } from '../api';
import dayjs from 'dayjs';
import InventoryTransactionModal from '../components/InventoryTransactionModal';

const { Title, Text } = Typography;

const categoryMap: Record<string, { label: string; color: string }> = {
  drug: { label: '药品', color: 'blue' },
  consumable: { label: '耗材', color: 'green' },
  reagent: { label: '试剂', color: 'orange' },
  equipment: { label: '设备', color: 'purple' },
};

const typeMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  in: { label: '入库', color: 'green', icon: <PlusOutlined /> },
  out: { label: '出库', color: 'red', icon: <MinusOutlined /> },
  adjust: { label: '盘点调整', color: 'orange', icon: <EditFilled /> },
};

const InventoryItemDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendDays, setTrendDays] = useState(30);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'in' | 'out' | 'adjust'>('in');

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await inventoryApi.getItemDetailWithTransactions(Number(id), {
        txPage,
        txPageSize,
      });
      setItem(res.item);
      setTransactions(res.transactions?.list || []);
      setTxTotal(res.transactions?.total || 0);
    } catch (error) {
      console.error('Failed to fetch item detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrend = async () => {
    if (!id) return;
    try {
      const data = await inventoryApi.getStockTrend(Number(id), trendDays);
      setTrendData(data || []);
    } catch (error) {
      console.error('Failed to fetch stock trend:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTrend();
  }, [id, txPage, trendDays]);

  const handleTransaction = (type: 'in' | 'out' | 'adjust') => {
    setTransactionType(type);
    setTransactionModalOpen(true);
  };

  const handleTransactionSuccess = () => {
    fetchData();
    fetchTrend();
  };

  const isLowStock = () => {
    if (!item) return false;
    return Number(item.currentQuantity) <= Number(item.safetyStock);
  };

  const isExpiringSoon = () => {
    if (!item?.expiryDate) return false;
    const daysLeft = dayjs(item.expiryDate).diff(dayjs(), 'day');
    return daysLeft <= 30;
  };

  const lineConfig = {
    data: trendData,
    xField: 'date',
    yField: 'quantity',
    point: {
      size: 4,
      shape: 'circle',
    },
    lineStyle: {
      lineWidth: 2,
    },
    color: '#1677ff',
    smooth: true,
    yAxis: {
      label: {
        formatter: (v: string) => `${v}`,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    tooltip: {
      formatter: (datum: any) => {
        return {
          name: '库存量',
          value: `${datum.quantity} ${item?.unit || ''}`,
        };
      },
    },
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inventory/items')}>
          返回列表
        </Button>
      </Space>

      {item && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 基础信息卡片 */}
          <Card>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={16}>
                <Space align="center" style={{ marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {item.name}
                  </Title>
                  <Tag color={categoryMap[item.category]?.color || 'default'}>
                    {categoryMap[item.category]?.label || item.category}
                  </Tag>
                  {isLowStock() && <Tag color="red">库存不足</Tag>}
                  {isExpiringSoon() && <Tag color="orange">即将过期</Tag>}
                </Space>

                <Descriptions column={2} size="small">
                  <Descriptions.Item label="规格">{item.specification || '-'}</Descriptions.Item>
                  <Descriptions.Item label="单位">{item.unit}</Descriptions.Item>
                  <Descriptions.Item label="存储位置">{item.storageLocation || '-'}</Descriptions.Item>
                  <Descriptions.Item label="供应商">{item.supplier || '-'}</Descriptions.Item>
                  <Descriptions.Item label="单价">
                    {item.unitPrice ? `¥${item.unitPrice}` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="有效期">
                    {item.expiryDate ? dayjs(item.expiryDate).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>
                    {item.remark || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>

              <Col xs={24} md={8}>
                <Card size="small" style={{ background: '#fafafa' }}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Statistic
                      title="当前库存"
                      value={item.currentQuantity}
                      suffix={item.unit}
                      valueStyle={{ color: isLowStock() ? '#ff4d4f' : '#333' }}
                    />
                    <Row>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>安全库存</Text>
                        <div style={{ fontSize: 16, fontWeight: 500 }}>
                          {item.safetyStock} {item.unit}
                        </div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>库存价值</Text>
                        <div style={{ fontSize: 16, fontWeight: 500 }}>
                          ¥{item.unitPrice ? (item.currentQuantity * item.unitPrice).toFixed(2) : '-'}
                        </div>
                      </Col>
                    </Row>
                    <Space>
                      <Button
                        type="primary"
                        icon={<ImportOutlined />}
                        onClick={() => handleTransaction('in')}
                        block
                      >
                        入库
                      </Button>
                      <Button
                        danger
                        icon={<ExportOutlined />}
                        onClick={() => handleTransaction('out')}
                        block
                      >
                        出库
                      </Button>
                    </Space>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleTransaction('adjust')}
                      block
                    >
                      盘点调整
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* 库存变化趋势 */}
          <Card
            title="库存变化趋势"
            extra={
              <Space>
                {[7, 14, 30, 90].map((days) => (
                  <Button
                    key={days}
                    type={trendDays === days ? 'primary' : 'default'}
                    size="small"
                    onClick={() => setTrendDays(days)}
                  >
                    {days}天
                  </Button>
                ))}
              </Space>
            }
          >
            {trendData.length > 0 ? (
              <div style={{ height: 300 }}>
                <Line {...lineConfig} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
                暂无趋势数据
              </div>
            )}
          </Card>

          {/* 出入库流水时间线 */}
          <Card
            title={
              <Space>
                <span>出入库流水</span>
                <Tag>{txTotal}</Tag>
              </Space>
            }
            extra={<Button type="link" onClick={() => handleTransaction('in')}>新增记录</Button>}
          >
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无流水记录
              </div>
            ) : (
              <List
                dataSource={transactions}
                renderItem={(tx: any) => {
                  const typeCfg = typeMap[tx.type] || typeMap.in;
                  const qty = Number(tx.quantity);
                  return (
                    <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: tx.type === 'in' ? '#f6ffed' : tx.type === 'out' ? '#fff1f0' : '#fff7e6',
                              color: tx.type === 'in' ? '#52c41a' : tx.type === 'out' ? '#ff4d4f' : '#fa8c16',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                            }}
                          >
                            {typeCfg.icon}
                          </div>
                        }
                        title={
                          <Space>
                            <Tag color={typeCfg.color}>{typeCfg.label}</Tag>
                            <Text strong style={{ fontSize: 16, color: tx.type === 'in' ? '#52c41a' : tx.type === 'out' ? '#ff4d4f' : '#fa8c16' }}>
                              {tx.type === 'adjust' ? (qty >= 0 ? '+' : '') + qty : (tx.type === 'in' ? '+' : '') + qty} {item.unit}
                            </Text>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Space size="large">
                              <span>
                                <CalendarOutlined style={{ marginRight: 4 }} />
                                {dayjs(tx.transactionDate).format('YYYY-MM-DD HH:mm')}
                              </span>
                              {tx.operator && (
                                <span>
                                  <UserOutlined style={{ marginRight: 4 }} />
                                  {tx.operator}
                                </span>
                              )}
                              {tx.experimentId && (
                                <span>
                                  <ExperimentOutlined style={{ marginRight: 4 }} />
                                  实验 #{tx.experimentId}
                                </span>
                              )}
                            </Space>
                            {tx.reason && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                原因：{tx.reason}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
            {txTotal > txPageSize && (
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Pagination
                  current={txPage}
                  pageSize={txPageSize}
                  total={txTotal}
                  onChange={(page) => setTxPage(page)}
                  showSizeChanger={false}
                  size="small"
                />
              </div>
            )}
          </Card>
        </Space>
      )}

      {/* 出入库弹窗 */}
      <InventoryTransactionModal
        open={transactionModalOpen}
        onCancel={() => setTransactionModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        defaultItemId={id ? Number(id) : null}
        defaultType={transactionType}
      />
    </div>
  );
};

export default InventoryItemDetail;
