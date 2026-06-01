import React, { memo } from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';

interface Props {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export const StockChart = memo(function StockChart({
  data,
  color,
  width = 100,
  height = 40,
}: Props) {
  if (!data || data.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pointsStr = points.join(' ');
  const isPositive = data[data.length - 1] >= data[0];
  const lineColor = isPositive ? '#3DDC97' : '#FF5C7A';

  const firstPoint = points[0].split(',');
  const lastPoint = points[points.length - 1].split(',');
  const fillPath = `M ${firstPoint[0]},${height} L ${pointsStr.replace(/(\d+\.?\d*),(\d+\.?\d*)/g, '$1,$2')} L ${lastPoint[0]},${height} Z`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id={`grad_${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0.02" />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={fillPath}
          fill={`url(#grad_${color.replace('#', '')})`}
        />
        <Polyline
          points={pointsStr}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
});
