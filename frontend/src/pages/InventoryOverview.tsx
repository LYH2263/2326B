import React, { useState, useEffect } from 'react';
import { Card, Row, Col, List, Tag, Typography, Button, Space, Alert } from 'antd';
import {
  MedicineBoxOutlined,
  ExperimentOutlined,
  ToolOutlined,
  AppstoreOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { inventoryApi } from '../api';
import dayjs from 'dayjs';

const { Text } = Typography;

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  drug: { label: '药品', icon: <MedicineBoxOutlined style={{ fontSize: 32 }} />, color: '#1677ff' },
  consumable: { label: '耗材', icon: <AppstoreOutlined style={{ fontSize: 32 }} />, color: '#52c41a' },
  reagent: { label: '试剂', icon: <ExperimentOutlined style={{ fontSize: 32 }} />, color: '#fa8c16' },
  equipment: { label: '设备', icon: <ToolOutlined style={{ fontSize: 32 }} />, color: '#722ed1' },
};

const InventoryOverview: React.FC = () => {
  const navigate = useNavigate();
  const [categorySummary, setCategorySummary] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any>({ lowStock: [], expiringSoon: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, warnRes] = await Promise.all([
        inventoryApi.getCategorySummary(),
        inventoryApi.getWarnings(),
      ]);
      setCategorySummary(summaryRes || []);
      setWarnings(warnRes || { lowStock: [], expiringSoon: [], total: 0 });
    } catch (error) {
      console.error('Failed to fetch inventory overview:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCategoryData = (cat: string) => {
    return categorySummary.find((item) => item.category === cat) || { count: 0, totalQty: 0 };
  };

  const allWarningItems = [
    ...warnings.lowStock.map((item: any) => ({ ...item, warningType: 'lowStock' })),
    ...warnings.expiringSoon
      .filter((item: any) => !warnings.lowStock.find((ls: any) => ls.id === item.id))
      .map((item: any) => ({ ...item, warningType: 'expiringSoon' })),
  ];

  const isExpiringSoon = (item: any) => {
    return warnings.expiringSoon.some((e: any) => e.id === item.id);
  };

  const isLowStock = (item: any) => {
    return warnings.lowStock.some((l: any) => l.id === item.id);
  };

  return (
    <div style={{ padding: 0 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 类别汇总卡片 */}
        <Card title="库存概览" extra={<Button type="link" onClick={() => navigate('/inventory/items')}>查看全部 <ArrowRightOutlined /></Button>}>
          <Row gutter={[16, 16]}>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const data = getCategoryData(key);
              return (
                <Col xs={12} sm={12} md={6} key={key}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/inventory/items?category=${key}`)}
                    style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          background: `${config.color}15`,
                          color: config.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{config.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#333' }}>
                          {Number(data.count || 0)}
                          <span style={{ fontSize: 14, fontWeight: 400, color: '#999', marginLeft: 4 }}>种</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                          总量 {Number(data.totalQty || 0)}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* 预警区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              title={
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  <span>库存不足预警</span>
                  <Tag color="red">{warnings.lowStock?.length || 0}</Tag>
                </Space>
              }
              size="small"
              extra={<Button type="link" size="small" onClick={() => navigate('/inventory/items?warningOnly=true')}>全部</Button>}
            >
              {warnings.lowStock?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  暂无库存不足物品
                </div>
              ) : (
                <List
                  size="small"
                  dataSource={warnings.lowStock?.slice(0, 5)}
                  renderItem={(item: any) => (
                    <List.Item
                      style={{ cursor: 'pointer', padding: '8px 0' }}
                      onClick={() => navigate(`/inventory/items/${item.id}`)}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                            <Tag color="red">库存不足</Tag>
                          </Space>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.specification || '-'} | 当前库存：
                            <Text strong style={{ color: '#ff4d4f' }}>
                              {item.currentQuantity} {item.unit}
                            </Text>
                            {' / '}安全库存：{item.safetyStock} {item.unit}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                  <span>即将过期预警</span>
                  <Tag color="orange">{warnings.expiringSoon?.length || 0}</Tag>
                </Space>
              }
              size="small"
              extra={<Button type="link" size="small" onClick={() => navigate('/inventory/items?warningOnly=true')}>全部</Button>}
            >
              {warnings.expiringSoon?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  暂无即将过期物品
                </div>
              ) : (
                <List
                  size="small"
                  dataSource={warnings.expiringSoon?.slice(0, 5)}
                  renderItem={(item: any) => {
                    const daysLeft = dayjs(item.expiryDate).diff(dayjs(), 'day');
                    const isExpired = daysLeft < 0;
                    return (
                      <List.Item
                        style={{ cursor: 'pointer', padding: '8px 0' }}
                        onClick={() => navigate(`/inventory/items/${item.id}`)}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <span style={{ fontWeight: 500 }}>{item.name}</span>
                              <Tag color={isExpired ? 'red' : 'orange'}>
                                {isExpired ? '已过期' : `还剩${daysLeft}天`}
                              </Tag>
                            </Space>
                          }
                          description={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              有效期至：{dayjs(item.expiryDate).format('YYYY-MM-DD')} | 库存：
                              {item.currentQuantity} {item.unit}
                            </Text>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* 综合预警列表 */}
        <Card title="预警物品清单">
          {allWarningItems.length === 0 ? (
            <Alert message="暂无预警物品，库存状态良好" type="success" showIcon />
          ) : (
            <Row gutter={[16, 16]}>
              {allWarningItems.map((item: any) => {
                const low = isLowStock(item);
                const expiring = isExpiringSoon(item);
                const daysLeft = dayjs(item.expiryDate).diff(dayjs(), 'day');
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => navigate(`/inventory/items/${item.id}`)}
                      style={{ borderLeft: '4px solid #ff4d4f' }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>{item.name}</Text>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        {item.specification || '-'}
                      </div>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        {low && (
                          <Tag color="red" style={{ margin: 0 }}>
                            库存不足：{item.currentQuantity}/{item.safetyStock} {item.unit}
                          </Tag>
                        )}
                        {expiring && (
                          <Tag color="orange" style={{ margin: 0 }}>
                            {daysLeft < 0 ? '已过期' : `即将过期：还剩${daysLeft}天`}
                          </Tag>
                        )}
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default InventoryOverview;
