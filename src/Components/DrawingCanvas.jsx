import { useRef, useEffect, useState } from "react";

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.strokeStyle = "black"; // Default line color
    context.lineWidth = 2; // Default line width
    context.lineCap = "round"; // Rounded line ends
    context.lineJoin = "round"; // Rounded line corners
  }, []);

  const startDrawing = (event) => {
    if (!drawMode) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = event.nativeEvent;
    setStartPoint({ x: offsetX, y: offsetY });
    setPoints([{ x: offsetX, y: offsetY }]);
  };

  const continueDrawing = (event) => {
    if (!drawMode || !isDrawing) return;
    const { offsetX, offsetY } = event.nativeEvent;
    setEndPoint({ x: offsetX, y: offsetY });
    setPoints([...points, { x: offsetX, y: offsetY }]);
  };

  const finishDrawing = () => {
    if (!drawMode) return;
    setIsDrawing(false);
    if (drawMode !== "highlight") {
      const newShape = {
        type: drawMode,
        start: { ...startPoint },
        end: { ...endPoint },
        points: [...points],
      };
      setShapes([...shapes, newShape]);
    } else {
      const newHighlight = {
        type: drawMode,
        start: { ...startPoint },
        end: { ...endPoint },
      };
      setShapes([...shapes, newHighlight]);
    }
    setPoints([]);
  };

  useEffect(() => {
    if (!isDrawing || !drawMode) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => {
      if (shape.type === "rectangle") {
        context.fillStyle = "rgba(255, 0, 0, 0.2)";
        const width = shape.end.x - shape.start.x;
        const height = shape.end.y - shape.start.y;
        context.beginPath();
        context.rect(shape.start.x, shape.start.y, width, height);
        context.stroke();
        context.fill();
      } else if (shape.type === "line") {
        context.beginPath();
        context.moveTo(shape.start.x, shape.start.y);
        context.lineTo(shape.end.x, shape.end.y);
        context.stroke();
      } else if (shape.type === "highlight") {
        context.fillStyle = "rgba(255, 255, 0, 0.5)"; // Yellow highlight color
        const width = shape.end.x - shape.start.x;
        const height = shape.end.y - shape.start.y;
        context.fillRect(shape.start.x, shape.start.y, width, height);
        // context.fillRect(shape.start.x, shape.start.y, width, height);
      } else if (shape.type === "freehand") {
        context.beginPath();
        context.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          context.lineTo(shape.points[i].x, shape.points[i].y);
        }
        context.stroke();
      }
    });

    if (isDrawing) {
      if (drawMode === "rectangle") {
        context.fillStyle = "rgba(255, 0, 0, 0.2)";
        const width = endPoint.x - startPoint.x;
        const height = endPoint.y - startPoint.y;
        context.beginPath();
        context.rect(startPoint.x, startPoint.y, width, height);
        context.stroke();
        context.fill();
      } else if (drawMode === "highlight") {
        context.fillStyle = "rgba(255, 255, 0, 0.5)"; // Yellow highlight color
        const width = endPoint.x - startPoint.x;
        const height = endPoint.y - startPoint.y;
        context.fillRect(startPoint.x, startPoint.y, width, height);
      } else if (drawMode === "line") {
        context.beginPath();
        context.moveTo(startPoint.x, startPoint.y);
        context.lineTo(endPoint.x, endPoint.y);
        context.stroke();
      } else if (drawMode === "freehand") {
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          context.lineTo(points[i].x, points[i].y);
        }
        context.stroke();
      }
    }
  }, [isDrawing, drawMode, shapes, startPoint, endPoint, points]);

  const handleDrawButtonClick = (mode) => {
    setDrawMode(mode);
  };

  return (
    <>
      <div>
        <button onClick={() => handleDrawButtonClick("rectangle")}>
          Draw Rectangle
        </button>
        <button onClick={() => handleDrawButtonClick("line")}>Draw Line</button>
        <button onClick={() => handleDrawButtonClick("highlight")}>
          Highlight
        </button>
        <button onClick={() => handleDrawButtonClick("freehand")}>
          Freehand Draw
        </button>
      </div>
      <div>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          style={{ border: "1px solid black" }}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={continueDrawing}
        />
      </div>
    </>
  );
};

export default DrawingCanvas;
