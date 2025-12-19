import { useEffect, useRef } from "react";

/**
 * Linear interpolation function (lerp)
 */
const lerp = (start, end, factor) => {
  return start + (end - start) * factor;
};

/**
 * RobotFace - Component khuôn mặt robot theo dõi chuột giống MetaMask
 * Low-poly / Origami / Hard-edge shading style
 * Props:
 * - size: number - Kích thước robot (default: 120)
 * - position: 'left' | 'right' | 'center' - Vị trí hiển thị (default: 'right')
 */
function RobotFace({ size = 120, position = "right" }) {
  const faceRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Target values (where we want to go)
  const targetRef = useRef({ 
    eyeX: 0, 
    eyeY: 0,
    headRotateX: 0,
    headRotateY: 0,
    headTranslateX: 0,
    headTranslateY: 0
  });
  
  // Current values (where we are now)
  const currentRef = useRef({ 
    eyeX: 0, 
    eyeY: 0,
    headRotateX: 0,
    headRotateY: 0,
    headTranslateX: 0,
    headTranslateY: 0
  });

  // Lerp factor - lower = smoother but slower (0.1 = very smooth)
  const lerpFactor = 0.15;

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!faceRef.current) return;

      const faceRect = faceRef.current.getBoundingClientRect();
      const faceCenterX = faceRect.left + faceRect.width / 2;
      const faceCenterY = faceRect.top + faceRect.height / 2;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Delta từ tâm đến chuột
      const deltaX = mouseX - faceCenterX;
      const deltaY = mouseY - faceCenterY;

      // Tính toán cho mắt (giới hạn trong phạm vi mắt)
      const maxEyeDistance = size * 0.15;
      const eyeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      let eyeX = deltaX;
      let eyeY = deltaY;

      if (eyeDistance > maxEyeDistance) {
        eyeX = (deltaX / eyeDistance) * maxEyeDistance;
        eyeY = (deltaY / eyeDistance) * maxEyeDistance;
      }

      // Tính toán cho đầu robot (rotation và translation)
      // Normalize delta để tính rotation (từ -1 đến 1)
      const maxHeadDistance = size * 2; // Phạm vi lớn hơn để tính rotation
      const normalizedX = Math.max(-1, Math.min(1, deltaX / maxHeadDistance));
      const normalizedY = Math.max(-1, Math.min(1, deltaY / maxHeadDistance));

      // Rotation: đầu nghiêng theo hướng chuột (max 15 độ)
      const maxRotation = 15;
      const headRotateX = normalizedY * maxRotation; // Nghiêng lên/xuống
      const headRotateY = normalizedX * maxRotation; // Nghiêng trái/phải

      // Translation: đầu di chuyển nhẹ theo chuột (max 8px)
      const maxTranslation = 8;
      const headTranslateX = normalizedX * maxTranslation;
      const headTranslateY = normalizedY * maxTranslation;

      // Cập nhật target values
      targetRef.current = {
        eyeX,
        eyeY,
        headRotateX,
        headRotateY,
        headTranslateX,
        headTranslateY
      };
    };

    // Animation loop với requestAnimationFrame
    const animate = () => {
      // Lerp tất cả các giá trị
      currentRef.current.eyeX = lerp(currentRef.current.eyeX, targetRef.current.eyeX, lerpFactor);
      currentRef.current.eyeY = lerp(currentRef.current.eyeY, targetRef.current.eyeY, lerpFactor);
      currentRef.current.headRotateX = lerp(currentRef.current.headRotateX, targetRef.current.headRotateX, lerpFactor);
      currentRef.current.headRotateY = lerp(currentRef.current.headRotateY, targetRef.current.headRotateY, lerpFactor);
      currentRef.current.headTranslateX = lerp(currentRef.current.headTranslateX, targetRef.current.headTranslateX, lerpFactor);
      currentRef.current.headTranslateY = lerp(currentRef.current.headTranslateY, targetRef.current.headTranslateY, lerpFactor);

      // Cập nhật DOM
      if (faceRef.current) {
        const faceElement = faceRef.current.querySelector('.robot-face-inner');
        const leftEyePolygon = faceRef.current.querySelector('.left-eye-polygon');
        const rightEyePolygon = faceRef.current.querySelector('.right-eye-polygon');
        const leftEyeHighlight = faceRef.current.querySelector('.left-eye-highlight');
        const rightEyeHighlight = faceRef.current.querySelector('.right-eye-highlight');

        if (faceElement) {
          faceElement.style.transform = `
            translate(${currentRef.current.headTranslateX}px, ${currentRef.current.headTranslateY}px)
            rotateX(${currentRef.current.headRotateX}deg)
            rotateY(${currentRef.current.headRotateY}deg)
          `;
        }

        // Di chuyển mắt theo chuột
        if (leftEyePolygon && leftEyeHighlight) {
          const eyeOffsetX = currentRef.current.eyeX * 0.3;
          const eyeOffsetY = currentRef.current.eyeY * 0.3;
          leftEyePolygon.setAttribute('transform', `translate(${eyeOffsetX}, ${eyeOffsetY})`);
          leftEyeHighlight.setAttribute('transform', `translate(${eyeOffsetX * 0.8}, ${eyeOffsetY * 0.8})`);
        }

        if (rightEyePolygon && rightEyeHighlight) {
          const eyeOffsetX = currentRef.current.eyeX * 0.3;
          const eyeOffsetY = currentRef.current.eyeY * 0.3;
          rightEyePolygon.setAttribute('transform', `translate(${eyeOffsetX}, ${eyeOffsetY})`);
          rightEyeHighlight.setAttribute('transform', `translate(${eyeOffsetX * 0.8}, ${eyeOffsetY * 0.8})`);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Bắt đầu animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [size]);

  const positionStyles = {
    left: { left: "2rem", top: "2rem" },
    right: { right: "2rem", top: "2rem" },
    center: { left: "50%", top: "50%", transform: "translate(-50%, -50%)" },
  };

  return (
    <div
      ref={faceRef}
      style={{
        position: "fixed",
        ...positionStyles[position],
        width: `${size}px`,
        height: `${size}px`,
        zIndex: 1000,
        pointerEvents: "none",
        userSelect: "none",
        perspective: "1000px",
        perspectiveOrigin: "center center",
      }}
    >
      {/* Khuôn mặt robot - Low-poly / Origami Style */}
      <div
        className="robot-face-inner"
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformStyle: "preserve-3d",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      >
        {/* SVG cho Low-poly style - Khuôn mặt rõ ràng hơn */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            overflow: "visible",
          }}
        >
          {/* Head - Main body (rounded rectangle với low-poly shading) - Làm rõ hơn */}
          
          {/* Mặt trên sáng (top face) */}
          <polygon
            points="25,35 175,35 165,55 35,55"
            fill="#ffffff"
            stroke="#d1d5db"
            strokeWidth="1"
          />
          
          {/* Mặt trái sáng (left face) */}
          <polygon
            points="25,35 35,55 35,145 25,165"
            fill="#f9fafb"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          
          {/* Mặt chính (front face) - trắng - Làm nổi bật hơn */}
          <polygon
            points="35,55 165,55 165,145 35,145"
            fill="#ffffff"
            stroke="#9ca3af"
            strokeWidth="2"
          />
          
          {/* Mặt phải tối (right face) */}
          <polygon
            points="165,55 175,35 175,165 165,145"
            fill="#e5e7eb"
            stroke="#d1d5db"
            strokeWidth="1"
          />
          
          {/* Mặt dưới tối (bottom face) */}
          <polygon
            points="35,145 165,145 175,165 25,165"
            fill="#d1d5db"
            stroke="#9ca3af"
            strokeWidth="1"
          />
          
          {/* Hard-edge highlight trên mặt chính - Rõ hơn */}
          <polygon
            points="35,55 165,55 160,62 40,62"
            fill="rgba(255, 255, 255, 0.8)"
            stroke="none"
          />
          <polygon
            points="35,55 40,62 40,72 35,65"
            fill="rgba(255, 255, 255, 0.6)"
            stroke="none"
          />
          
          {/* Top dome - Low-poly - Làm to và rõ hơn */}
          <polygon
            points="85,15 115,15 120,30 110,38 90,38 80,30"
            fill="#f9fafb"
            stroke="#e5e7eb"
            strokeWidth="1.5"
          />
          <polygon
            points="90,38 110,38 115,48 105,55 95,55 85,48"
            fill="#ffffff"
            stroke="#d1d5db"
            strokeWidth="1.5"
          />
          <polygon
            points="90,38 100,42 100,50 95,52 90,50 85,45"
            fill="rgba(255, 255, 255, 0.7)"
            stroke="none"
          />
          
          {/* Left ear/antenna - Low-poly - Làm to và rõ hơn */}
          <polygon
            points="15,65 30,72 38,85 30,100 15,92 8,80"
            fill="#f9fafb"
            stroke="#e5e7eb"
            strokeWidth="1.5"
          />
          <polygon
            points="15,65 8,80 15,92 30,100 38,85 30,72"
            fill="#ffffff"
            stroke="#d1d5db"
            strokeWidth="1.5"
          />
          <polygon
            points="18,72 28,76 32,82 28,90 18,86 14,80"
            fill="rgba(255, 255, 255, 0.6)"
            stroke="none"
          />
          
          {/* Right ear/antenna - Low-poly - Làm to và rõ hơn */}
          <polygon
            points="185,65 170,72 162,85 170,100 185,92 192,80"
            fill="#e5e7eb"
            stroke="#d1d5db"
            strokeWidth="1.5"
          />
          <polygon
            points="185,65 192,80 185,92 170,100 162,85 170,72"
            fill="#f9fafb"
            stroke="#e5e7eb"
            strokeWidth="1.5"
          />
          <polygon
            points="182,72 172,76 168,82 172,90 182,86 186,80"
            fill="rgba(255, 255, 255, 0.5)"
            stroke="none"
          />
          
          {/* Screen/Dark face area - Recessed với low-poly shading - Làm rõ và to hơn */}
          <polygon
            points="45,65 155,65 162,75 155,125 45,125 38,115"
            fill="#111827"
            stroke="#030712"
            strokeWidth="2"
          />
          {/* Left shadow của screen */}
          <polygon
            points="45,65 38,115 45,125 52,118 52,72"
            fill="#030712"
            stroke="#000000"
            strokeWidth="1"
          />
          {/* Right highlight của screen */}
          <polygon
            points="155,65 162,75 155,125 148,118 148,72"
            fill="#374151"
            stroke="#1f2937"
            strokeWidth="1"
          />
          {/* Top highlight của screen */}
          <polygon
            points="45,65 155,65 152,72 48,72"
            fill="#374151"
            stroke="none"
          />
          
          {/* Eyes - Glowing blue với low-poly style - Làm to và sáng hơn */}
          {/* Left eye - Base */}
          <g className="left-eye-polygon" transform="translate(0, 0)">
            <polygon
              points="65,88 88,82 95,95 88,108 65,102 58,95"
              fill="#3b82f6"
              stroke="#2563eb"
              strokeWidth="2"
              opacity="1"
            />
            {/* Left eye highlight */}
            <polygon
              className="left-eye-highlight"
              points="70,90 85,85 90,95 85,105 70,100 65,95"
              fill="#60a5fa"
              stroke="none"
              opacity="0.9"
            />
            {/* Left eye center glow */}
            <polygon
              points="73,92 82,89 85,95 82,101 73,98 70,95"
              fill="#93c5fd"
              stroke="none"
              opacity="0.8"
            />
            {/* Left eye brightest center */}
            <polygon
              points="76,94 79,93 80,95 79,97 76,96 75,95"
              fill="#bfdbfe"
              stroke="none"
              opacity="1"
            />
          </g>
          
          {/* Right eye - Base */}
          <g className="right-eye-polygon" transform="translate(0, 0)">
            <polygon
              points="112,88 135,82 142,95 135,108 112,102 105,95"
              fill="#3b82f6"
              stroke="#2563eb"
              strokeWidth="2"
              opacity="1"
            />
            {/* Right eye highlight */}
            <polygon
              className="right-eye-highlight"
              points="117,90 132,85 137,95 132,105 117,100 112,95"
              fill="#60a5fa"
              stroke="none"
              opacity="0.9"
            />
            {/* Right eye center glow */}
            <polygon
              points="120,92 129,89 132,95 129,101 120,98 117,95"
              fill="#93c5fd"
              stroke="none"
              opacity="0.8"
            />
            {/* Right eye brightest center */}
            <polygon
              points="123,94 126,93 127,95 126,97 123,96 122,95"
              fill="#bfdbfe"
              stroke="none"
              opacity="1"
            />
          </g>
          
          {/* Mouth - Glowing blue U-shape với low-poly - Làm to và sáng hơn */}
          <polygon
            points="75,120 125,120 132,128 125,142 75,142 68,128"
            fill="#3b82f6"
            stroke="#2563eb"
            strokeWidth="2"
            opacity="1"
          />
          {/* Mouth highlight */}
          <polygon
            points="80,122 120,122 125,128 120,138 80,138 75,128"
            fill="#60a5fa"
            stroke="none"
            opacity="0.9"
          />
          {/* Mouth center glow */}
          <polygon
            points="90,128 110,128 113,131 110,135 90,135 87,131"
            fill="#93c5fd"
            stroke="none"
            opacity="0.8"
          />
          {/* Mouth brightest center */}
          <polygon
            points="95,130 105,130 106,131 105,133 95,133 94,131"
            fill="#bfdbfe"
            stroke="none"
            opacity="1"
          />
        </svg>
      </div>
    </div>
  );
}

export default RobotFace;
