import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithHint: Story = {
  args: {
    hint: 'We will never share your email.',
  },
};

export const WithError: Story = {
  args: {
    error: 'Enter a valid email address.',
    defaultValue: 'not-an-email',
  },
};

export const Required: Story = {
  args: {
    label: 'Full name',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'readonly@example.com',
  },
};

export const WithAddons: Story = {
  args: {
    label: 'Amount',
    leadingAddon: '$',
    trailingAddon: 'USD',
    inputMode: 'decimal',
  },
};
