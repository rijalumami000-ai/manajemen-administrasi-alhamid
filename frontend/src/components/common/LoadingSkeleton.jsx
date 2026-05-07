import React from 'react';
import { Skeleton, Card, Row, Col } from 'antd';
import './LoadingSkeleton.scss';

export function LoadingSkeleton({ type = 'table', count = 5, rows = 3 }) {
  // Table Skeleton - Ant Design version
  if (type === 'table') {
    return (
      <div className="skeleton-table-wrapper">
        <Skeleton.Input active block style={{ marginBottom: 16, height: 40 }} />
        <Skeleton active paragraph={{ rows: count || 8 }} />
      </div>
    );
  }

  // Card Grid Skeleton - Ant Design version
  if (type === 'card-grid') {
    return (
      <Row gutter={[16, 16]} className="skeleton-card-grid">
        {Array.from({ length: count }).map((_, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  // Single Card Skeleton - Ant Design version
  if (type === 'card') {
    return (
      <div className="skeleton-cards">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} style={{ marginBottom: 16 }}>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </Card>
        ))}
      </div>
    );
  }

  // Stats Skeleton - Ant Design version
  if (type === 'stats') {
    return (
      <Row gutter={[16, 16]} className="skeleton-stats">
        {Array.from({ length: count || 4 }).map((_, index) => (
          <Col key={index} xs={24} sm={12} lg={6}>
            <Card>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  // Form Skeleton - Ant Design version
  if (type === 'form') {
    return (
      <div className="skeleton-form">
        <Skeleton.Input active block style={{ marginBottom: 16 }} />
        <Skeleton.Input active block style={{ marginBottom: 16 }} />
        <Skeleton.Input active block style={{ marginBottom: 16 }} />
        <Skeleton.Button active block style={{ marginTop: 8 }} />
      </div>
    );
  }

  // List Skeleton - Ant Design version
  if (type === 'list') {
    return (
      <div className="skeleton-list">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="skeleton-list-item">
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    );
  }

  // Profile Skeleton - Ant Design version
  if (type === 'profile') {
    return (
      <div className="skeleton-profile">
        <div className="skeleton-profile-header">
          <Skeleton.Avatar active size={80} />
          <div className="skeleton-profile-info">
            <Skeleton.Input active style={{ width: 200, marginBottom: 8 }} />
            <Skeleton.Input active style={{ width: 150 }} />
          </div>
        </div>
        <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 24 }} />
      </div>
    );
  }

  // Default: simple loading - Ant Design version
  return (
    <div className="skeleton-simple">
      <Skeleton active paragraph={{ rows: rows || 3 }} />
    </div>
  );
}

