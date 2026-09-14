'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import api from '@/lib/api';

/**
 * Password recovery for the management portal.
 *
 * Only managers and admins can recover from here, because only they have a password:
 * the API mails them a single-use Supabase recovery link. Attendants sign in on mobile
 * with phone + PIN and have no password at all — their PIN is reset by a station
 * manager, so there is nothing for them to self-serve on the web.
 *
 * The endpoint answers identically whether or not the account exists, so this component
 * shows the same confirmation either way. Do not add "no account found" feedback here:
 * that would turn the form into a way to discover which emails are registered.
 */
export function ForgotPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [emailForm] = Form.useForm();

  const close = () => {
    onClose();
    // Reset after the closing animation so the content doesn't visibly change.
    setTimeout(() => {
      setSent(null);
      setError('');
      emailForm.resetFields();
    }, 250);
  };

  const handleSubmit = async (values: { email: string }) => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/password/forgot', { email: values.email });
      setSent(
        'If that email is registered, a reset link is on its way. Check your inbox, including spam.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      title="Reset your password"
      footer={
        sent
          ? [
              <Button key="close" type="primary" onClick={close}>
                Done
              </Button>,
            ]
          : null
      }
      destroyOnClose
    >
      {sent ? (
        <Alert type="success" showIcon message={sent} className="!rounded-xl" />
      ) : (
        <>
          {error && (
            <Alert type="error" showIcon message={error} className="!mb-4 !rounded-xl" />
          )}

          <p className="text-ink-secondary mb-4">
            Enter the email you sign in with and we&apos;ll send you a link to choose a
            new password. The link can be used once and expires shortly.
          </p>

          <Form form={emailForm} layout="vertical" requiredMark={false} onFinish={handleSubmit}>
            <Form.Item
              name="email"
              label={<span className="text-sm font-semibold text-ink-secondary">Email</span>}
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-ink-disabled" />}
                placeholder="you@company.com"
                className="!h-11 !rounded-xl"
                autoComplete="email"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              className="!h-11 !rounded-xl !font-bold"
            >
              Send reset link
            </Button>
          </Form>

          {/* Without this an attendant who lands here has no idea where to go instead. */}
          <p className="text-ink-muted text-xs mt-4 mb-0 leading-relaxed">
            Attendants sign in on the mobile app with a phone number and PIN. Ask your
            station manager to set you a new PIN.
          </p>
        </>
      )}
    </Modal>
  );
}
