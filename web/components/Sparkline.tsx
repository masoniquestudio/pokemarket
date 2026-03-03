'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

type Props = {
  data: { value: number }[];
  color?: string;
  height?: number;
};

export default function Sparkline({
  data,
  color = '#f7d02c',
  height = 44,
}: Props) {
  if (!data || data.length < 2) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            height: 1,
            background: '#ebebeb',
          }}
        />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
