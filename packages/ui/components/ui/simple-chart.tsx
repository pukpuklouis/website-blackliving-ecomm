'use client';

import * as React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartConfig } from './chart';

export interface SimpleChartProps {
  data: Array<{
    month: string;
    sales: number;
    orders: number;
  }>;
}

const chartConfig = {
  sales: {
    label: '銷售額',
  },
  orders: {
    label: '訂單數',
  },
} satisfies ChartConfig;

export function SimpleChart({ data }: SimpleChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeOpacity={0}
            dot={{
              r: 5,
              fill: 'hsl(var(--primary))',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
