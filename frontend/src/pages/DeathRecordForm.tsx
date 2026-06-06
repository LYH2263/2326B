import React, { useEffect, useState } from 'react';
import {
  Card, Form, Input, Select, DatePicker, Button, Space, message,
  Divider, Collapse, Upload, Typography, Row, Col, Tag,
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, UploadOutlined,
  PlusOutlined, DeleteOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { deathRecordApi, animalApi, necropsyReportApi } from '../api';

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Title, Text } = Typography;

const causeCategoryOptions = [
  { value: 'natural', label: '自然死亡' },
  { value: 'experiment_termination', label: '实验终止' },
  { value: 'accidental', label: '意外死亡' },
  { value: 'euthanasia', label: '安乐死' },
];

const disposalMethodOptions = [
  { value: 'necropsy', label: '尸检' },
  { value: 'incineration', label: '焚化' },
  { value: 'cryopreservation', label: '冷冻保存' },
];

const DeathRecordForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== 'new';
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [animals, setAnimals] = useState<any[]>([]);
  const [necropsyExpanded, setNecropsyExpanded] = useState<string[]>([]);
  const [necropsyImages, setNecropsyImages] = useState<string[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);

  const fetchAnimals = async () => {
    try {
      const res: any = await animalApi.getList({ page: 1, pageSize: 200 });
      const animalList = res?.list || [];
      if (isEdit) {
        setAnimals(animalList);
      } else {
        setAnimals(animalList.filter((a: any) => a.status !== 'deceased'));
      }
    } catch {
      // handled
    }
  };

  const fetchDetail = async (recordId: number) => {
    try {
      setLoading(true);
      const res: any = await deathRecordApi.getDetail(recordId);
      setSelectedAnimal(res.animal);
      setNecropsyImages(res.necropsyReport?.imageUrls || []);

      form.setFieldsValue({
        ...res,
        deathDatetime: res.deathDatetime ? dayjs(res.deathDatetime) : null,
        necropsyReport: res.necropsyReport ? {
          ...res.necropsyReport,
          necropsyDate: res.necropsyReport.necropsyDate
            ? dayjs(res.necropsyReport.necropsyDate)
            : null,
        } : undefined,
      });

      if (res.necropsyReport) {
        setNecropsyExpanded(['necropsy']);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      fetchDetail(parseInt(id, 10));
    }
  }, [id]);

  const handleAnimalChange = (value: number) => {
    const animal = animals.find(a => a.id === value);
    setSelectedAnimal(animal || null);
  };

  const handleDisposalChange = (value: string) => {
    if (value === 'necropsy') {
      setNecropsyExpanded(['necropsy']);
      form.setFieldsValue({ necropsyStatus: 'pending' });
    } else {
      form.setFieldsValue({ necropsyStatus: 'not_needed' });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload: any = {
        ...values,
        deathDatetime: values.deathDatetime?.format('YYYY-MM-DDTHH:mm:ss'),
      };

      if (values.disposalMethod === 'necropsy' && necropsyExpanded.includes('necropsy') && values.necropsyReport) {
        payload.necropsyReport = {
          ...values.necropsyReport,
          necropsyDate: values.necropsyReport.necropsyDate?.format('YYYY-MM-DD'),
          imageUrls: necropsyImages,
        };
        if (values.necropsyReport.necropsyDate) {
          payload.necropsyStatus = 'completed';
        }
      } else {
        delete payload.necropsyReport;
      }

      if (isEdit && id) {
        await deathRecordApi.update(parseInt(id, 10), payload);
        message.success('更新成功');
      } else {
        await deathRecordApi.create(payload);
        message.success('登记成功');
      }

      navigate('/death-records');
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (file: File, reportId: number) => {
    try {
      await necropsyReportApi.uploadImage(reportId, file);
      const res: any = await necropsyReportApi.getDetail(reportId);
      setNecropsyImages(res.imageUrls || []);
      message.success('上传成功');
    } catch {
      // handled
    }
    return false;
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (!isEdit || !id) return;
    try {
      const detail: any = await deathRecordApi.getDetail(parseInt(id, 10));
      if (detail.necropsyReport) {
        await necropsyReportApi.removeImage(detail.necropsyReport.id, imageUrl);
        setNecropsyImages(prev => prev.filter(u => u !== imageUrl));
        message.success('删除成功');
      }
    } catch {
      // handled
    }
  };

  const uploadProps: UploadProps = {
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('图片大小不能超过 10MB');
        return false;
      }
      if (isEdit && id) {
        deathRecordApi.getDetail(parseInt(id, 10)).then((detail: any) => {
          if (detail.necropsyReport) {
            handleUploadImage(file, detail.necropsyReport.id);
          } else {
            message.warning('请先保存尸检报告信息后再上传图片');
          }
        });
      } else {
        message.warning('请先保存死亡记录后再上传图片');
      }
      return false;
    },
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/death-records')}>
          返回列表
        </Button>
      </Space>

      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#6b7280' }} />
            <span style={{ fontWeight: 600 }}>{isEdit ? '编辑死亡记录' : '死亡登记'}</span>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            causeCategory: 'natural',
            disposalMethod: 'incineration',
            necropsyStatus: 'not_needed',
          }}
          style={{ marginTop: 8 }}
        >
          <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>基本信息</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="animalId"
                label="动物"
                rules={[{ required: true, message: '请选择动物' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="children"
                  placeholder="选择动物"
                  disabled={isEdit}
                  onChange={handleAnimalChange}
                >
                  {animals.map(a => (
                    <Option key={a.id} value={a.id} disabled={a.status === 'deceased' && !isEdit}>
                      {a.name} ({a.species}) {a.status === 'deceased' && !isEdit && ' - 已死亡'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deathDatetime"
                label="死亡日期时间"
                rules={[{ required: true, message: '请选择死亡时间' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {selectedAnimal && (
            <Card
              size="small"
              style={{ marginBottom: 16, background: '#f9fafb' }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text type="secondary">当前选中动物：</Text>
                <Space>
                  <Text strong>{selectedAnimal.name}</Text>
                  <Tag>{selectedAnimal.species}</Tag>
                  <Tag color={selectedAnimal.status === 'deceased' ? 'default' : 'green'}>
                    {selectedAnimal.status === 'deceased' ? '已死亡' : '存活'}
                  </Tag>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {selectedAnimal.breed && `品系: ${selectedAnimal.breed}  `}
                  {selectedAnimal.gender && `性别: ${selectedAnimal.gender === 'male' ? '雄性' : selectedAnimal.gender === 'female' ? '雌性' : '未知'}  `}
                  {selectedAnimal.weight && `体重: ${selectedAnimal.weight}g`}
                </Text>
              </Space>
            </Card>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="causeCategory"
                label="死亡原因分类"
                rules={[{ required: true }]}
              >
                <Select>
                  {causeCategoryOptions.map(o => (
                    <Option key={o.value} value={o.value}>{o.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="foundBy" label="发现人">
                <Input placeholder="发现人姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="causeDescription" label="详细死亡原因描述">
            <TextArea rows={3} placeholder="请详细描述死亡原因" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="confirmingVet" label="确认兽医">
                <Input placeholder="确认兽医姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="disposalMethod"
                label="处置方式"
                rules={[{ required: true }]}
              >
                <Select onChange={handleDisposalChange}>
                  {disposalMethodOptions.map(o => (
                    <Option key={o.value} value={o.value}>{o.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '24px 0 16px' }} />

          <Collapse
            activeKey={necropsyExpanded}
            onChange={(keys) => setNecropsyExpanded(Array.isArray(keys) ? keys as string[] : [])}
            style={{ marginBottom: 16 }}
          >
            <Panel header="尸检报告（可选）" key="necropsy">
              <Form.Item name={['necropsyReport', 'necropsyDate']} label="尸检日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name={['necropsyReport', 'performedBy']} label="执行人">
                <Input placeholder="尸检执行人姓名" />
              </Form.Item>

              <Form.Item name={['necropsyReport', 'grossFindings']} label="大体观察结果">
                <TextArea rows={3} placeholder="请描述大体观察结果" />
              </Form.Item>

              <Form.Item name={['necropsyReport', 'histopathologyFindings']} label="组织病理学发现">
                <TextArea rows={3} placeholder="请描述组织病理学发现" />
              </Form.Item>

              <Form.Item name={['necropsyReport', 'finalDiagnosis']} label="最终诊断">
                <TextArea rows={3} placeholder="请填写最终诊断" />
              </Form.Item>

              <Form.Item label="尸检图片">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Upload.Dragger {...uploadProps} style={{ padding: '16px' }}>
                    <p className="ant-upload-drag-icon">
                      <PlusOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
                    <p className="ant-upload-hint" style={{ fontSize: 12 }}>
                      {isEdit ? '支持 jpg、png、gif、webp 格式，单张不超过 10MB' : '请先保存死亡记录后再上传图片'}
                    </p>
                  </Upload.Dragger>

                  {necropsyImages.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {necropsyImages.map((url, index) => (
                        <div
                          key={index}
                          style={{
                            position: 'relative',
                            width: 100,
                            height: 100,
                            borderRadius: 6,
                            overflow: 'hidden',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <img
                            src={url}
                            alt={`尸检图片 ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              background: 'rgba(0,0,0,0.5)',
                              color: '#fff',
                            }}
                            onClick={() => handleRemoveImage(url)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Space>
              </Form.Item>
            </Panel>
          </Collapse>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => navigate('/death-records')}>取消</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                loading={saving}
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DeathRecordForm;
