import { useRef, useEffect, useState } from "react";
import { CiViewTimeline } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { LuRectangleHorizontal } from "react-icons/lu";
import { FaGripLines, FaOpenid, FaHighlighter } from "react-icons/fa";
import { AiOutlineClear } from "react-icons/ai";

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [points, setPoints] = useState([]);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const ctxRef = useRef(null);
  const [scale] = useState(1);
  const [offset] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [resizingRectIndex, setResizingRectIndex] = useState(null);
  const [resizeDirection, setResizeDirection] = useState(null);
  const prevXRef = useRef(null);
  const prevYRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    ctxRef.current = canvas.getContext("2d");

    const context = ctxRef.current;
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.fillStyle = "rgba(255, 0, 0, 0.2)";

    canvas.addEventListener("dblclick", handleDoubleClick);

    return () => {
      canvas.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [rectangles]);

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
    setPoints((prevPoints) => [...prevPoints, { x: offsetX, y: offsetY }]);
  };

  const finishDrawing = () => {
    if (!drawMode) return;
    setIsDrawing(false);
    if (drawMode !== "highlight" && drawMode !== "text") {
      const newShape = {
        type: drawMode,
        start: { ...startPoint },
        end: { ...endPoint },
        points: [...points],
      };
      setShapes((prevShapes) => [...prevShapes, newShape]);
    } else if (drawMode === "highlight") {
      const newHighlight = {
        type: drawMode,
        start: { ...startPoint },
        end: { ...endPoint },
      };
      setShapes((prevShapes) => [...prevShapes, newHighlight]);
    }
    setPoints([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    const drawElement = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);
      elements.forEach((el) => {
        ctx.fillStyle = el.isSelected ? "blue" : "red";
        ctx.fillRect(el.x, el.y, el.width, el.height);
      });
      ctx.restore();
    };

    const checkSelection = (mouseX, mouseY) => {
      elements.forEach((el) => {
        el.isSelected = false;
        if (
          mouseX >= el.x &&
          mouseX <= el.x + el.width &&
          mouseY >= el.y &&
          mouseY <= el.y + el.height
        ) {
          el.isSelected = true;
        }
      });
    };

    const mousedown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / scale - offset.x;
      const mouseY = (e.clientY - rect.top) / scale - offset.y;

      checkSelection(mouseX, mouseY);
      drawElement();
      elements.forEach((el) => {
        if (el.isSelected) {
          window.addEventListener("mousemove", mousemove);
          window.addEventListener("mouseup", mouseup);
        }
      });
    };

    const mousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / scale - offset.x;
      const mouseY = (e.clientY - rect.top) / scale - offset.y;

      elements.forEach((el) => {
        if (el.isSelected) {
          const deltaX = mouseX - (prevXRef.current || mouseX);
          const deltaY = mouseY - (prevYRef.current || mouseY);

          el.x += deltaX;
          el.y += deltaY;

          drawElement();
          prevXRef.current = mouseX;
          prevYRef.current = mouseY;
        }
      });
    };

    const mouseup = () => {
      window.removeEventListener("mousemove", mousemove);
      window.removeEventListener("mouseup", mouseup);
    };

    canvas.addEventListener("mousedown", mousedown);

    drawElement();

    return () => {
      canvas.removeEventListener("mousedown", mousedown);
      window.removeEventListener("mousemove", mousemove);
      window.removeEventListener("mouseup", mouseup);
    };
  }, [elements, scale, offset]);

  useEffect(() => {
    if (!isDrawing || !drawMode) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach((shape) => {
      if (!shape.start) return;
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
        context.fillStyle = "rgba(255, 255, 0, 0.5)";
        const width = shape.end.x - shape.start.x;
        const height = shape.end.y - shape.start.y;
        context.fillRect(shape.start.x, shape.start.y, width, height);
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
        context.fillStyle = "rgba(255, 255, 0, 0.5)";
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
  }, [isDrawing, drawMode, shapes, startPoint, endPoint, points, textPosition]);

  const handleDrawButtonClick = (mode) => {
    setDrawMode((prevMode) => (prevMode === mode ? null : mode));
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setShapes([]);
    setRectangles([]); // Clear the rectangles as well
  };

  const handleDoubleClick = (event) => {
    const { offsetX, offsetY } = event;

    const clickedRectangle = rectangles.find((rect) => {
      return (
        offsetX >= rect.start.x &&
        offsetX <= rect.end.x &&
        offsetY >= rect.start.y &&
        offsetY <= rect.end.y
      );
    });

    if (clickedRectangle) {
      const newText = prompt("Enter text:");
      if (newText !== null) {
        setRectangles((prevRectangles) => {
          return prevRectangles.map((rect) => {
            if (rect === clickedRectangle) {
              return { ...rect, text: newText };
            }
            return rect;
          });
        });
      }
    }
  };

  const handleCanvasClick = (event) => {
    const { offsetX, offsetY } = event.nativeEvent;

    if (drawMode === "text") {
      setTextPosition({ x: offsetX, y: offsetY });
      const newRectangle = {
        start: { x: offsetX, y: offsetY },
        end: { x: offsetX + 100, y: offsetY + 50 },
        text: "",
      };
      setRectangles([...rectangles, newRectangle]);
    }
  };

  const handleMouseMove = (event) => {
    if (resizingRectIndex !== null && resizeDirection) {
      const { offsetX, offsetY } = event.nativeEvent;
      setRectangles((prevRectangles) => {
        const updatedRectangles = [...prevRectangles];
        const clickedRect = updatedRectangles[resizingRectIndex];
        const { end } = clickedRect;
        switch (resizeDirection) {
          case "bottomRight":
            end.x = offsetX;
            end.y = offsetY;
            break;
          default:
            break;
        }
        return updatedRectangles;
      });
    }
  };

  const handleMouseUp = () => {
    setResizingRectIndex(null);
    setResizeDirection(null);
  };

  const deleteSelectedElement = () => {
    setElements((prevElements) => prevElements.filter((el) => !el.isSelected));
  };

  const cloneShapesAndRectangles = () => {
    return {
      shapes: JSON.parse(JSON.stringify(shapes)),
      rectangles: JSON.parse(JSON.stringify(rectangles)),
    };
  };

  const drawClonedShapesOnNewCanvas = () => {
    const clonedData = cloneShapesAndRectangles();

    // Create a new canvas element
    const newCanvas = document.createElement("canvas");
    newCanvas.width = canvasRef.current.width;
    newCanvas.height = canvasRef.current.height;
    const newCtx = newCanvas.getContext("2d");

    // Draw the cloned shapes on the new canvas
    clonedData.shapes.forEach((shape) => {
      if (shape.type === "rectangle") {
        const width = shape.end.x - shape.start.x;
        const height = shape.end.y - shape.start.y;
        newCtx.fillStyle = "rgba(255, 0, 0, 0.2)";
        newCtx.beginPath();
        newCtx.rect(shape.start.x, shape.start.y, width, height);
        newCtx.stroke();
        newCtx.fill();
      } else if (shape.type === "line") {
        newCtx.beginPath();
        newCtx.moveTo(shape.start.x, shape.start.y);
        newCtx.lineTo(shape.end.x, shape.end.y);
        newCtx.stroke();
      } else if (shape.type === "highlight") {
        newCtx.fillStyle = "rgba(255, 255, 0, 0.5)";
        const width = shape.end.x - shape.start.x;
        const height = shape.end.y - shape.start.y;
        newCtx.fillRect(shape.start.x, shape.start.y, width, height);
      } else if (shape.type === "freehand") {
        newCtx.beginPath();
        newCtx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          newCtx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        newCtx.stroke();
      }
    });

    // Draw the cloned rectangles with text on the new canvas
    clonedData.rectangles.forEach((rect) => {
      const width = rect.end.x - rect.start.x;
      const height = rect.end.y - rect.start.y;
      newCtx.fillStyle = "rgba(255, 0, 0, 0.2)";
      newCtx.beginPath();
      newCtx.rect(rect.start.x, rect.start.y, width, height);
      newCtx.stroke();
      newCtx.fill();
      if (rect.text) {
        newCtx.fillStyle = "black";
        newCtx.font = "16px Arial";
        newCtx.fillText(rect.text, rect.start.x + 5, rect.start.y + 20);
      }
    });

    // Append the new canvas to the document body or a specific container
    document.body.appendChild(newCanvas);
  };

  return (
    <>
      <div className="button-container">
        <button
          onClick={() => handleDrawButtonClick("rectangle")}
          title="Rectangle"
        >
          <LuRectangleHorizontal />
        </button>
        <button onClick={() => handleDrawButtonClick("line")} title="Line">
          <FaGripLines />
        </button>
        <button
          onClick={() => handleDrawButtonClick("highlight")}
          title="Highlight"
        >
          <FaHighlighter />
        </button>
        <button
          onClick={() => handleDrawButtonClick("freehand")}
          title="Freehand"
        >
          <FaOpenid />
        </button>
        <button onClick={() => handleDrawButtonClick("text")} title="Text">
          <CiViewTimeline />
        </button>

        <button onClick={handleClearCanvas} title="Clear Canvas">
          <AiOutlineClear />
        </button>
        <button onClick={deleteSelectedElement} title="Delete Selected">
          <MdDelete />
        </button>
        <button onClick={drawClonedShapesOnNewCanvas} title="Copy Canvas">
          Copy Canvas
        </button>
      </div>

      <div>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          style={{ border: "1px solid black" }}
          onMouseDown={startDrawing}
          onMouseUp={(e) => {
            finishDrawing();
            handleMouseUp(e);
          }}
          onMouseMove={(e) => {
            continueDrawing(e);
            handleMouseMove(e);
          }}
          onClick={handleCanvasClick}
        />
        {rectangles.map((rect, index) => (
          <div
            key={index}
            contentEditable
            style={{
              position: "absolute",
              top: rect.start.y,
              left: rect.start.x,
              width: rect.end.x - rect.start.x,
              height: rect.end.y - rect.start.y,
              border: "2px solid black",
              pointerEvents: "auto",
              overflow: "hidden",
            }}
          >
            {rect.text}
          </div>
        ))}
      </div>
    </>
  );
};

export default DrawingCanvas;
