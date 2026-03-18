import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function ListCheckIcon({ size = 16, color = '#312a47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 448 512" fill="none">
      <Path
        d="M152.485 262.379L174.955 284.853C180.813 290.712 190.378 290.712 196.236 284.853L244.715 236.379M152.485 390.379L174.955 412.853C180.813 418.712 190.378 418.712 196.236 412.853L244.715 364.379M152.485 134.379L174.955 156.853C180.813 162.712 190.378 162.712 196.236 156.853L244.715 108.379M288 136H384M288 264H384M288 392H384M64 96H64.01M64 224H64.01M64 352H64.01"
        stroke={color}
        strokeWidth={32}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PenToSquareIcon({ size = 16, color = '#312a47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <Path
        d="M441.6 70.4C429.1 57.9 412.5 51.2 395.2 51.2C377.9 51.2 361.3 57.9 348.8 70.4L128 291.2V384H220.8L441.6 163.2C454.1 150.7 460.8 134.1 460.8 116.8C460.8 99.5 454.1 82.9 441.6 70.4Z"
        stroke={color}
        strokeWidth={32}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M384 384V432C384 440.5 380.6 448.6 374.6 454.6C368.6 460.6 360.5 464 352 464H80C71.5 464 63.4 460.6 57.4 454.6C51.4 448.6 48 440.5 48 432V160C48 151.5 51.4 143.4 57.4 137.4C63.4 131.4 71.5 128 80 128H128"
        stroke={color}
        strokeWidth={32}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SettingsIcon({ size = 16, color = '#312a47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <Path
        d="M256 320C291.3 320 320 291.3 320 256C320 220.7 291.3 192 256 192C220.7 192 192 220.7 192 256C192 291.3 220.7 320 256 320Z"
        stroke={color}
        strokeWidth={32}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M440.5 310.2L416.3 296.2C419.1 282.9 420.5 269.5 420.5 256C420.5 242.5 419.1 229.1 416.3 215.8L440.5 201.8C446.5 198.3 449.5 191.3 447.8 184.6C439.5 153.8 424.5 125.5 404.2 101.8C399.5 96.3 391.8 94.8 385.5 98.3L361.3 112.3C351.3 103.5 340.2 95.9 328.2 89.8V61.8C328.2 54.8 323.5 48.6 316.8 46.8C285.5 38.5 252.8 37.8 221.2 46.8C214.5 48.6 209.8 54.8 209.8 61.8V89.8C197.8 95.9 186.7 103.5 176.7 112.3L152.5 98.3C146.2 94.8 138.5 96.3 133.8 101.8C113.5 125.5 98.5 153.8 90.2 184.6C88.5 191.3 91.5 198.3 97.5 201.8L121.7 215.8C118.9 229.1 117.5 242.5 117.5 256C117.5 269.5 118.9 282.9 121.7 296.2L97.5 310.2C91.5 313.7 88.5 320.7 90.2 327.4C98.5 358.2 113.5 386.5 133.8 410.2C138.5 415.7 146.2 417.2 152.5 413.7L176.7 399.7C186.7 408.5 197.8 416.1 209.8 422.2V450.2C209.8 457.2 214.5 463.4 221.2 465.2C252.5 473.5 285.2 474.2 316.8 465.2C323.5 463.4 328.2 457.2 328.2 450.2V422.2C340.2 416.1 351.3 408.5 361.3 399.7L385.5 413.7C391.8 417.2 399.5 415.7 404.2 410.2C424.5 386.5 439.5 358.2 447.8 327.4C449.5 320.7 446.5 313.7 440.5 310.2Z"
        stroke={color}
        strokeWidth={32}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AutoScheduleIcon({ size = 16, color = '#312a47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 448 512" fill="none">
      <Rect x="48" y="96" width="352" height="368" rx="24" stroke={color} strokeWidth={32} />
      <Path d="M48 192H400" stroke={color} strokeWidth={32} />
      <Path d="M128 48V144" stroke={color} strokeWidth={32} strokeLinecap="round" />
      <Path d="M320 48V144" stroke={color} strokeWidth={32} strokeLinecap="round" />
      <Path
        d="M224 288L224 384M224 384L272 336M224 384L176 336"
        stroke={color}
        strokeWidth={28}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SortIcon({ size = 16, color = '#312a47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 320 512" fill="none">
      <Path
        d="M160 48L256 160H64L160 48Z"
        fill={color}
      />
      <Path
        d="M160 464L64 352H256L160 464Z"
        fill={color}
      />
    </Svg>
  );
}

export function TypeIcon({ size = 12, color = '#312a47', icon = 'circle' }: IconProps & { icon?: string }) {
  if (icon === 'square') {
    return (
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Rect x="3" y="3" width="10" height="10" rx="2" fill={color} />
      </Svg>
    );
  }
  if (icon === 'star') {
    return (
      <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <Path
          d="M8 2L9.8 6.2L14 6.9L10.9 9.8L11.6 14L8 12L4.4 14L5.1 9.8L2 6.9L6.2 6.2L8 2Z"
          fill={color}
        />
      </Svg>
    );
  }
  // Default: circle (task)
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x="2.5" y="2.5" width="11" height="11" rx="4.5" fill={color} />
    </Svg>
  );
}

export function EllipsisIcon({ size = 16, color = '#312a47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="3" cy="8" r="1.5" fill={color} />
      <Circle cx="8" cy="8" r="1.5" fill={color} />
      <Circle cx="13" cy="8" r="1.5" fill={color} />
    </Svg>
  );
}

export function TrashIcon({ size = 16, color = '#312a47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 448 512" fill="none">
      <Path
        d="M160 400C160 408.8 152.8 416 144 416C135.2 416 128 408.8 128 400V192C128 183.2 135.2 176 144 176C152.8 176 160 183.2 160 192V400ZM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V192C208 183.2 215.2 176 224 176C232.8 176 240 183.2 240 192V400ZM320 400C320 408.8 312.8 416 304 416C295.2 416 288 408.8 288 400V192C288 183.2 295.2 176 304 176C312.8 176 320 183.2 320 192V400ZM310.1 22.6L336.9 64H432C440.8 64 448 71.2 448 80C448 88.8 440.8 96 432 96H416V432C416 476.2 380.2 512 336 512H112C67.8 512 32 476.2 32 432V96H16C7.2 96 0 88.8 0 80C0 71.2 7.2 64 16 64H111.1L137.9 22.6C145.8 8.6 160.8 0 177.1 0H270.9C287.2 0 302.2 8.6 310.1 22.6ZM153.9 64H294.1L279.1 40.2C277.8 38.1 275.5 36.8 273 36.8H175C172.5 36.8 170.2 38.1 168.9 40.2L153.9 64ZM80 432C80 449.7 94.3 464 112 464H336C353.7 464 368 449.7 368 432V96H80V432Z"
        fill={color}
      />
    </Svg>
  );
}

export function PlusIcon({ size = 12, color = '#312a47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M6 1V11M1 6H11" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function PriorityIcon({ size = 16, color = '#312a47' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 256" fill="none">
      <Path
        d="M32 16V160"
        stroke={color}
        strokeWidth={24}
        strokeLinecap="round"
      />
      <Path
        d="M32 224V228"
        stroke={color}
        strokeWidth={28}
        strokeLinecap="round"
      />
    </Svg>
  );
}
