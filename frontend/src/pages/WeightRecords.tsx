import React, { useState } from 'react';
import { Card, Tabs, Space } from 'antd';
import {
  ThunderboltOutlined,
  HistoryOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import QuickWeighing from './weight/QuickWeighing';
import WeightHistory from './weight/WeightHistory';
import WeightAnalysis from './weight/WeightAnalysis';

const WeightRecords: React.FC = () => {
  const [activeKey, setActiveKey] = useState('quick');

  const tabItems = [
    {
      key: 'quick',
      label: (
        <Space>
          <ThunderboltOutlined />
          快速称重
        </Space>
      ),
      children: <QuickWeighing />,
    },
    {
      key: 'history',
      label: (
        <Space>
          <HistoryOutlined />
          称重历史
        </Space>
      ),
      children: <WeightHistory />,
    },
    {
      key: 'analysis',
      label: (
        <Space>
          <BarChartOutlined />
          群体分析
        </Space>
      ),
      children: <WeightAnalysis />,
    },
  ];

  return (
    <Card
      style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      bodyStyle={{ padding: '16px 0 0' }}
    >
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={tabItems}
        size="large"
        style={{ padding: '0 24px' }}
      />
    </Card>
  );
};

export default WeightRecords;
