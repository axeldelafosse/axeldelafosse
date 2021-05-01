import React from 'react';

export default function Logo({ color = '#000' }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill={color} viewBox="0 0 80 80">
      <title>think outside the box</title>
      <polygon points="63.33 46.67 40 0 16.67 46.67 63.33 46.67" />
      <polygon points="13.33 53.33 0 80 80 80 66.67 53.33 13.33 53.33" />
    </svg>
  );
}
