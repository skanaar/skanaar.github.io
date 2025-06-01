import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const ImageCanvas = ({ imageData, className, style }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!imageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match ImageData
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    // Draw the ImageData to the canvas
    ctx.putImageData(imageData, 0, 0);
  }, [imageData]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: 'block', // Removes bottom margin
        ...style
      }}
    />
  );
};

ImageCanvas.propTypes = {
  imageData: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    data: PropTypes.instanceOf(Uint8ClampedArray).isRequired,
  }),
  className: PropTypes.string,
  style: PropTypes.object,
};

ImageCanvas.defaultProps = {
  className: '',
  style: {},
};

export default ImageCanvas;