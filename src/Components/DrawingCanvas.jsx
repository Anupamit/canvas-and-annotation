import { useRef, useEffect, useState } from "react";

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [shapes, setShapes] = useState([]);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [points, setPoints] = useState([]);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });

  const ctxRef = useRef(null);
  const isResizingRef = useRef(false);
  const currentResizerRef = useRef(null);
  const prevXRef = useRef(0);
  const prevYRef = useRef(0);
  const [selectedElementIndex, setSelectedElementIndex] = useState(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState([
    {
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      isSelected: false,
    },
    // Add more elements if needed
  ]);
  const [rectangles, setRectangles] = useState([]);
  const [resizingRectIndex, setResizingRectIndex] = useState(null);
  const [resizeDirection, setResizeDirection] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.strokeStyle = "black"; // Default line color
    context.lineWidth = 2; // Default line width
    context.lineCap = "round"; // Rounded line ends
    context.lineJoin = "round"; // Rounded line corners

    context.fillStyle = "rgba(255, 0, 0, 0.2)"; // Fill color with transparency

    // Event listener for double-click on canvas
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
    setPoints([...points, { x: offsetX, y: offsetY }]);
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
      setShapes([...shapes, newShape]);
    } else if (drawMode === "highlight") {
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
    const canvas = canvasRef.current;
    ctxRef.current = canvas.getContext("2d");
    const ctx = ctxRef.current;

    const drawElement = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(offset.x, offset.y);
      elements.forEach((el, index) => {
        ctx.fillStyle = el.isSelected ? "blue" : "red"; // Change color if selected
        ctx.fillRect(el.x, el.y, el.width, el.height);
        if (el.isSelected) {
          setSelectedElementIndex(index);
        }
      });
      ctx.restore();
    };

    const checkSelection = (mouseX, mouseY) => {
      elements.forEach((el) => {
        el.isSelected = false; // Deselect all elements first
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
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      checkSelection(mouseX, mouseY);
      drawElement();
      elements.forEach((el) => {
        if (el.isSelected) {
          window.addEventListener("mousemove", mousemove);
          window.addEventListener("mouseup", mouseup);

          prevXRef.current = mouseX;
          prevYRef.current = mouseY;
        }
      });
    };

    const mousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      elements.forEach((el) => {
        if (el.isSelected) {
          if (!isResizingRef.current) {
            const deltaX = mouseX - prevXRef.current;
            const deltaY = mouseY - prevYRef.current;

            el.x += deltaX;
            el.y += deltaY;

            drawElement();
          } else {
            const deltaX = mouseX - prevXRef.current;
            const deltaY = mouseY - prevYRef.current;

            if (currentResizerRef.current.classList.contains("se")) {
              el.width += deltaX;
              el.height += deltaY;
            } else if (currentResizerRef.current.classList.contains("sw")) {
              el.width -= deltaX;
              el.height += deltaY;
              el.x += deltaX;
            } else if (currentResizerRef.current.classList.contains("ne")) {
              el.width += deltaX;
              el.height -= deltaY;
              el.y += deltaY;
            } else {
              el.width -= deltaX;
              el.height -= deltaY;
              el.x += deltaX;
              el.y += deltaY;
            }

            drawElement();
          }

          prevXRef.current = mouseX;
          prevYRef.current = mouseY;
        }
      });
    };
    const mouseup = () => {
      window.removeEventListener("mousemove", mousemove);
      window.removeEventListener("mouseup", mouseup);
      isResizingRef.current = false;
    };
    const resizers = document.querySelectorAll(".resizer");
    resizers.forEach((resizer) => {
      resizer.addEventListener("mousedown", (e) => {
        currentResizerRef.current = e.target;
        isResizingRef.current = true;
        window.addEventListener("mousemove", mousemove);
        window.addEventListener("mouseup", mouseup);
      });
    });
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
        context.fillStyle = "rgba(255, 255, 0, 0.5)"; // Yellow highlight color
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
  }, [isDrawing, drawMode, shapes, startPoint, endPoint, points, textPosition]);

  const handleDrawButtonClick = (mode) => {
    setDrawMode(mode === drawMode ? false : mode);
  };
  // const handleDrawButtonClick = () => {
  //   setDrawMode(!drawMode);
  // };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setShapes([]); // Clear all shapes
  };

  // const handleCanvasClick = (event) => {
  //   const { offsetX, offsetY } = event.nativeEvent;
  //   if (drawMode === "text") {
  //     setTextPosition({ x: offsetX, y: offsetY });
  //   }
  // };
  const handleDoubleClick = (event) => {
    const { offsetX, offsetY } = event;

    // Find if double-click occurred within any existing rectangle
    const clickedRectangle = rectangles.find((rect) => {
      return (
        offsetX >= rect.start.x &&
        offsetX <= rect.end.x &&
        offsetY >= rect.start.y &&
        offsetY <= rect.end.y
      );
    });

    // If a rectangle is found, allow adding text
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
    }

    if (drawMode) {
      const { offsetX, offsetY } = event.nativeEvent;
      const newRectangle = {
        start: { x: offsetX, y: offsetY },
        end: { x: offsetX + 100, y: offsetY + 50 },
        text: "",
      };
      setRectangles([...rectangles, newRectangle]);
    } else {
      // Check if resizing rectangle
      const { offsetX, offsetY } = event.nativeEvent;
      const clickedRectangleIndex = rectangles.findIndex((rect) => {
        return (
          offsetX >= rect.start.x &&
          offsetX <= rect.end.x &&
          offsetY >= rect.start.y &&
          offsetY <= rect.end.y
        );
      });
      if (clickedRectangleIndex !== -1) {
        setResizingRectIndex(clickedRectangleIndex);
        // Determine resize direction
        const clickedRect = rectangles[clickedRectangleIndex];
        const { x, y } = clickedRect.start;
        const { end } = clickedRect;
        const rectWidth = end.x - x;
        const rectHeight = end.y - y;
        if (
          offsetX >= x + rectWidth - 5 &&
          offsetX <= x + rectWidth + 5 &&
          offsetY >= y + rectHeight - 5 &&
          offsetY <= y + rectHeight + 5
        ) {
          setResizeDirection("bottomRight");
        } else {
          setResizeDirection(null);
        }
      } else {
        setResizingRectIndex(null);
        setResizeDirection(null);
      }
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
    if (selectedElementIndex !== null) {
      const updatedElements = [...elements];
      updatedElements.splice(selectedElementIndex, 1);
      setElements(updatedElements);
    }
  };

  const resetCanvas = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setScale(scale * 1.1);

  const handleZoomOut = () => setScale(scale / 1.1);

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
        <button onClick={() => handleDrawButtonClick("text")}>Add Text</button>

        <button onClick={handleClearCanvas}>Clear</button>
        <button onClick={resetCanvas}>Reset Zoom</button>
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
        <button onClick={deleteSelectedElement}>Delete</button>
        <button onClick={handleDrawButtonClick}>Text</button>
      </div>
      <div>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          style={{ border: "1px solid black" }}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing || handleMouseUp}
          onMouseMove={continueDrawing || handleMouseMove}
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
              border: "2px solid black", // Invisible border
              pointerEvents: "auto", // Enable mouse events
              overflow: "hidden", // Prevent text overflow
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
