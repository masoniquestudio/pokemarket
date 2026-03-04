'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

type Props = {
  data: { value: number }[];
  color?: string;
  height?: number;
};

export default function Sparkline({
  data,
  color = '#737373',
  height = 44,
}: Props) {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="w-full h-px bg-border" />
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
