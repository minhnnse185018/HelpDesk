function LogoutIcon({ size = 24, color = "#374151" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Door Frame - 3 sides (left, top, bottom), right side is open */}
      <path
        d="M6 5V19M6 5H14M6 19H14"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Arrow - horizontal shaft with arrowhead pointing right */}
      <path
        d="M15 12H20M20 12L17.5 9.5M20 12L17.5 14.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default LogoutIcon;

