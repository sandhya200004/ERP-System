import React, { useState } from 'react';
import { Button, Space, Card, Typography } from 'antd';
import { IdcardOutlined } from '@ant-design/icons';
import ReflectiveCard from './ReflectiveCard';
import EmployeeBadgeModal from './EmployeeBadgeModal';

const { Title } = Typography;

/**
 * Example component demonstrating usage of ReflectiveCard and EmployeeBadgeModal
 * This is for reference/testing purposes only
 */
const BadgeExample: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <IdcardOutlined /> Badge Component Examples
      </Title>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Example 1: Static Badge */}
        <Card title="Example 1: Static Badge (No Webcam)">
          <ReflectiveCard
            employeeName="JOHN DOE"
            employeeTitle="SOFTWARE ENGINEER"
            employeeId="EMP-2025-001"
            enableWebcam={false}
          />
        </Card>

        {/* Example 2: Live Webcam Badge */}
        <Card title="Example 2: Live Webcam Badge">
          <ReflectiveCard
            employeeName="JANE SMITH"
            employeeTitle="PRODUCT MANAGER"
            employeeId="EMP-2025-002"
            enableWebcam={true}
          />
        </Card>

        {/* Example 3: Modal */}
        <Card title="Example 3: Badge in Modal">
          <Button
            type="primary"
            icon={<IdcardOutlined />}
            onClick={() => setShowModal(true)}
            size="large"
          >
            Show Badge Modal
          </Button>

          <EmployeeBadgeModal
            visible={showModal}
            onClose={() => setShowModal(false)}
            employeeName="ALEX JOHNSON"
            employeeTitle="TEAM LEAD"
            employeeId="EMP-2025-003"
            enableWebcam={true}
            title="Employee Badge Verification"
          />
        </Card>

        {/* Example 4: Custom Styling */}
        <Card title="Example 4: Custom Styled Badge">
          <ReflectiveCard
            employeeName="SARAH WILLIAMS"
            employeeTitle="UX DESIGNER"
            employeeId="EMP-2025-004"
            enableWebcam={false}
            blurStrength={20}
            metalness={0.7}
            roughness={0.6}
            color="#00ff88"
            overlayColor="rgba(0, 255, 136, 0.15)"
          />
        </Card>
      </Space>
    </div>
  );
};

export default BadgeExample;
