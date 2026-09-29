import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    title: 'Ceramic Pour-Over Set',
    subtitle: 'Kitchen · In stock',
    children: 'Hand-glazed stoneware with a matched dripper and carafe.',
    footer: <Button size="sm">View details</Button>,
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    interactive: true,
    footer: undefined,
  },
};
