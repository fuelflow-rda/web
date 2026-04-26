'use client';

import React from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Divider,
  Switch,
  Row,
  Col,
  message,
  Avatar,
  Space,
} from 'antd';
import { UserOutlined, SaveOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleProfileUpdate = async (values: { name: string; email: string; phone: string }) => {
    try {
      await api.patch('/users/me', values);
      message.success('Profile updated successfully');
    } catch {
      message.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (values: { currentPassword: string; newPassword: string }) => {
    try {
      await api.patch('/users/me/password', values);
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch {
      message.error('Failed to change password');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <Title level={3} className="!mb-0">Settings</Title>
        <Text type="secondary">Manage your account and preferences</Text>
      </div>

      <Row gutter={[24, 24]} align="stretch">
        <Col xs={24} lg={14} xl={15}>
          <Card title="Profile" className="!rounded-xl h-full">
            <div className="flex items-center gap-4 mb-6">
              <Avatar size={64} className="!bg-fuel-orange" icon={<UserOutlined />} />
              <div>
                <Text strong className="text-lg block">{user?.name}</Text>
                <Text type="secondary">{user?.role}</Text>
              </div>
            </div>

            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{
                name: user?.name,
                email: user?.email,
              }}
              onFinish={handleProfileUpdate}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="phone" label="Phone">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Changes
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10} xl={9}>
          <Card
            title="Change Password"
            className="!rounded-xl h-full lg:sticky lg:top-24"
          >
            <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true }]}
              >
                <Input.Password />
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords do not match'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" icon={<LockOutlined />}>
                Change Password
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title="Notification Preferences" className="!rounded-xl">
        <Space direction="vertical" className="w-full" size="middle">
          <div className="flex items-center justify-between">
            <div>
              <Text strong>Email Notifications</Text>
              <br />
              <Text type="secondary">Receive email alerts for important events</Text>
            </div>
            <Switch defaultChecked />
          </div>
          <Divider className="!my-2" />
          <div className="flex items-center justify-between">
            <div>
              <Text strong>Discrepancy Alerts</Text>
              <br />
              <Text type="secondary">Get notified when reconciliation discrepancies are found</Text>
            </div>
            <Switch defaultChecked />
          </div>
          <Divider className="!my-2" />
          <div className="flex items-center justify-between">
            <div>
              <Text strong>Inactive Pump Alerts</Text>
              <br />
              <Text type="secondary">Alert when pumps have no activity for 30+ minutes</Text>
            </div>
            <Switch defaultChecked />
          </div>
        </Space>
      </Card>
    </div>
  );
}
