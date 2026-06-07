import React, { useEffect, useState, useCallback } from 'react';
import {
  Card, Input, Select, DatePicker, Button, Space, Image, Empty, Spin,
  Tag, Tooltip, Popconfirm, message, Pagination, Avatar,
} from 'antd';
import {
  SearchOutlined, TagOutlined, DeleteOutlined, EyeOutlined,
  ReloadOutlined, PictureOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { animalPhotoApi, animalApi } from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const defaultTagOptions = ['术前', '术后', '皮肤异常', '正常', '解剖', '给药', '体重测量', '其他'];

const PhotoLibrary: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [keyword, setKeyword] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<string>('');
  const [animalFilter, setAnimalFilter] = useState<number | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [animalList, setAnimalList] = useState<any[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        pageSize,
      };
      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (keyword) {
        params.keyword = keyword;
      }
      if (animalFilter) {
        params.animalId = animalFilter;
      }
      const res: any = await animalPhotoApi.getList(params);
      setPhotos(res?.list || []);
      setTotal(res?.total || 0);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedTags, dateRange, keyword, animalFilter]);

  const fetchAllTags = useCallback(async () => {
    try {
      const res: any = await animalPhotoApi.getAllTags();
      if (Array.isArray(res)) {
        const tagSet = new Set([...defaultTagOptions, ...res]);
        setAllTags(Array.from(tagSet));
      } else {
        setAllTags(defaultTagOptions);
      }
    } catch {
      setAllTags(defaultTagOptions);
    }
  }, []);

  const fetchSpecies = useCallback(async () => {
    try {
      const res: any = await animalApi.getSpecies();
      setSpeciesList(Array.isArray(res) ? res : []);
    } catch {
      // handled
    }
  }, []);

  const fetchAnimals = useCallback(async () => {
    try {
      const params: any = { pageSize: 100 };
      if (speciesFilter) {
        params.species = speciesFilter;
      }
      const res: any = await animalApi.getList(params);
      setAnimalList(res?.list || []);
    } catch {
      // handled
    }
  }, [speciesFilter]);

  useEffect(() => {
    fetchPhotos();
    fetchAllTags();
    fetchSpecies();
  }, [fetchPhotos, fetchAllTags, fetchSpecies]);

  useEffect(() => {
    if (speciesFilter) {
      fetchAnimals();
    } else {
      setAnimalList([]);
      setAnimalFilter(null);
    }
  }, [speciesFilter, fetchAnimals]);

  const handleDelete = async (photoId: number) => {
    try {
      await animalPhotoApi.delete(photoId);
      message.success('删除成功');
      fetchPhotos();
      fetchAllTags();
    } catch {
      // handled
    }
  };

  const handlePreview = (index: number) => {
    if (photos.length > 0 && photos[index]) {
      setPreviewIndex(index);
      setPreviewVisible(true);
    }
  };

  const renderPhotos = () => {
    if (loading && photos.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (photos.length === 0) {
      return <Empty description="暂无图片" style={{ padding: '80px 0' }} />;
    }

    return (
      <>
        <Image.PreviewGroup
          preview={{
            visible: previewVisible,
            current: previewIndex,
            onVisibleChange: (visible) => setPreviewVisible(visible),
            onChange: (current) => setPreviewIndex(current),
          }}
          items={photos.map((p) => p.imageUrl)}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {photos.map((photo, index) => (
              <Card
                key={photo.id}
                hoverable
                style={{ borderRadius: 10, overflow: 'hidden' }}
                bodyStyle={{ padding: 0 }}
                onClick={() => handlePreview(index)}
                cover={
                  <div style={{
                    aspectRatio: '1',
                    overflow: 'hidden',
                    background: '#f5f5f5',
                    cursor: 'pointer',
                  }}>
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.originalFilename}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                  </div>
                }
              >
                <div style={{ padding: '10px 12px' }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 6,
                  }} title={photo.originalFilename}>
                    {photo.originalFilename}
                  </div>
                  {photo.animal && (
                    <div style={{
                      fontSize: 12,
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginBottom: 6,
                    }}>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                        {photo.animal.name}
                      </Tag>
                      <span style={{ color: '#999' }}>{photo.animal.species}</span>
                    </div>
                  )}
                  {photo.tags && photo.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      marginBottom: 8,
                    }}>
                      {photo.tags.slice(0, 3).map((tag: string) => (
                        <Tag key={tag} style={{ margin: 0, fontSize: 11 }}>
                          {tag}
                        </Tag>
                      ))}
                      {photo.tags.length > 3 && (
                        <Tag style={{ margin: 0, fontSize: 11 }}>
                          +{photo.tags.length - 3}
                        </Tag>
                      )}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    color: '#999',
                  }}>
                    <span>{dayjs(photo.createdAt).format('YYYY-MM-DD')}</span>
                    <Space size={4}>
                      <Tooltip title="查看大图">
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={(e) => { e.stopPropagation(); handlePreview(index); }}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="确定删除这张图片吗？"
                        onConfirm={(e) => { e?.stopPropagation(); handleDelete(photo.id); }}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Tooltip title="删除">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Image.PreviewGroup>

        {total > pageSize && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              showTotal={(t) => `共 ${t} 张图片`}
              pageSizeOptions={['12', '24', '48', '96']}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <PictureOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 600 }}>图片库</span>
          </Space>
        }
        extra={
          <Tag color="blue">共 {total} 张</Tag>
        }
      >
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <Input
            placeholder="搜索描述/文件名"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => { setPage(1); fetchPhotos(); }}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="物种筛选"
            allowClear
            style={{ width: 140 }}
            value={speciesFilter || undefined}
            onChange={(v) => { setSpeciesFilter(v || ''); setAnimalFilter(null); setPage(1); }}
          >
            {speciesList.map(s => <Option key={s} value={s}>{s}</Option>)}
          </Select>
          <Select
            placeholder="动物筛选"
            allowClear
            style={{ width: 160 }}
            value={animalFilter || undefined}
            onChange={(v) => { setAnimalFilter(v || null); setPage(1); }}
            disabled={!speciesFilter}
          >
            {animalList.map((a: any) => (
              <Option key={a.id} value={a.id}>{a.name}</Option>
            ))}
          </Select>
          <Select
            mode="tags"
            placeholder="标签筛选"
            style={{ minWidth: 200, maxWidth: 360 }}
            value={selectedTags}
            onChange={(v) => { setSelectedTags(v); setPage(1); }}
            tokenSeparators={[',']}
          >
            {allTags.map(tag => (
              <Option key={tag} value={tag}>{tag}</Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates: any) => { setDateRange(dates as any); setPage(1); }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => {
            setSelectedTags([]);
            setDateRange(null);
            setKeyword('');
            setSpeciesFilter('');
            setAnimalFilter(null);
            setPage(1);
            fetchPhotos();
          }}>
            重置
          </Button>
        </div>

        {renderPhotos()}
      </Card>
    </div>
  );
};

export default PhotoLibrary;
