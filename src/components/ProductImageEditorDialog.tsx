"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/Button";
import { RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

const PREVIEW_WIDTH = 720;
const PREVIEW_HEIGHT = 540;
const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = 900;

interface ProductImageAdjustments {
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

interface ProductImageEditorDialogProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nextImageUrl: string) => void;
}

const defaultAdjustments: ProductImageAdjustments = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
};

function loadImageElement(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imageElement = new Image();

    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = () => reject(new Error("Unable to load the selected image."));
    imageElement.src = imageUrl;
  });
}

function useDialogVisibility(
  dialogReference: RefObject<HTMLDialogElement>,
  isOpen: boolean,
) {
  useEffect(() => {
    const dialogElement = dialogReference.current;
    if (!dialogElement) {
      return;
    }

    if (isOpen && !dialogElement.open) {
      dialogElement.showModal();
      return;
    }

    if (!isOpen && dialogElement.open) {
      dialogElement.close();
    }
  }, [dialogReference, isOpen]);
}

function drawAdjustedImage(
  canvasElement: HTMLCanvasElement,
  imageElement: HTMLImageElement,
  adjustments: ProductImageAdjustments,
) {
  const context = canvasElement.getContext("2d");
  if (!context) {
    return;
  }

  const { width, height } = canvasElement;
  const baseScale = Math.max(width / imageElement.width, height / imageElement.height);
  const translatedOffsetX = (adjustments.offsetX / 100) * width * 0.35;
  const translatedOffsetY = (adjustments.offsetY / 100) * height * 0.35;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#e5e7eb";
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(width / 2 + translatedOffsetX, height / 2 + translatedOffsetY);
  context.rotate((adjustments.rotation * Math.PI) / 180);
  context.scale(baseScale * adjustments.zoom, baseScale * adjustments.zoom);
  context.drawImage(
    imageElement,
    -imageElement.width / 2,
    -imageElement.height / 2,
  );
  context.restore();
}

function AdjustmentSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div
        className="flex items-center justify-between text-text-secondary"
        style={{ marginBottom: SPACING.xs, fontSize: fontSizes.caption }}
      >
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        className="w-full accent-[var(--accent)]"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}

/** Renders a modal used to crop and adjust product images before saving them. */
export function ProductImageEditorDialog({
  imageUrl,
  isOpen,
  onClose,
  onSave,
}: ProductImageEditorDialogProps) {
  const dialogReference = useRef<HTMLDialogElement | null>(null);
  const previewCanvasReference = useRef<HTMLCanvasElement | null>(null);
  const [adjustments, setAdjustments] = useState(defaultAdjustments);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useDialogVisibility(dialogReference, isOpen);

  useEffect(() => {
    const dialogElement = dialogReference.current;
    if (!dialogElement) {
      return;
    }

    function handleCancel(event: Event) {
      event.preventDefault();
      onClose();
    }

    dialogElement.addEventListener("cancel", handleCancel);
    return () => dialogElement.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  useEffect(() => {
    if (!imageUrl || !isOpen) {
      setImageElement(null);
      setErrorMessage(null);
      return;
    }

    let isCancelled = false;
    const sourceImageUrl = imageUrl;
    setIsLoading(true);
    setErrorMessage(null);
    setAdjustments(defaultAdjustments);

    async function prepareImage() {
      try {
        const nextImageElement = await loadImageElement(sourceImageUrl);
        if (!isCancelled) {
          setImageElement(nextImageElement);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to open that image.");
          setImageElement(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void prepareImage();
    return () => {
      isCancelled = true;
    };
  }, [imageUrl, isOpen]);

  useEffect(() => {
    const previewCanvas = previewCanvasReference.current;
    if (!previewCanvas || !imageElement) {
      return;
    }

    drawAdjustedImage(previewCanvas, imageElement, adjustments);
  }, [adjustments, imageElement]);

  function updateAdjustment(
    fieldName: keyof ProductImageAdjustments,
    value: number,
  ) {
    setAdjustments((previousAdjustments) => ({
      ...previousAdjustments,
      [fieldName]: value,
    }));
  }

  function handleSave() {
    if (!imageElement) {
      return;
    }

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_WIDTH;
    exportCanvas.height = EXPORT_HEIGHT;
    drawAdjustedImage(exportCanvas, imageElement, adjustments);
    onSave(exportCanvas.toDataURL("image/jpeg", 0.88));
  }

  return (
    <dialog
      className="w-full max-w-4xl border border-[var(--border)] bg-bg-primary text-text-primary backdrop:bg-black/50"
      ref={dialogReference}
      style={{ borderRadius: RADIUS.lg, padding: 0 }}
    >
      <div style={{ padding: SPACING.xl }}>
        <div className="flex items-start justify-between" style={{ gap: SPACING.lg }}>
          <div>
            <h2 style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold }}>
              Adjust Product Photo
            </h2>
            <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
              Crop the image, adjust the framing, and save the final product photo.
            </p>
          </div>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)]" style={{ gap: SPACING.xl, marginTop: SPACING.xl }}>
          <div
            className="overflow-hidden border border-[var(--border)] bg-bg-surface"
            style={{ borderRadius: RADIUS.md }}
          >
            {isLoading ? (
              <div
                className="flex items-center justify-center text-text-secondary"
                style={{ aspectRatio: "4 / 3", fontSize: fontSizes.body }}
              >
                Preparing image...
              </div>
            ) : null}
            {!isLoading && errorMessage ? (
              <div
                className="flex items-center justify-center text-danger"
                style={{ aspectRatio: "4 / 3", padding: SPACING.lg, fontSize: fontSizes.body }}
              >
                {errorMessage}
              </div>
            ) : null}
            {!isLoading && !errorMessage ? (
              <canvas
                height={PREVIEW_HEIGHT}
                ref={previewCanvasReference}
                style={{ aspectRatio: "4 / 3", display: "block", width: "100%" }}
                width={PREVIEW_WIDTH}
              />
            ) : null}
          </div>
          <div className="flex flex-col" style={{ gap: SPACING.lg }}>
            <div className="flex flex-col" style={{ gap: SPACING.md }}>
              <AdjustmentSlider
                label="Zoom"
                max={3}
                min={1}
                onChange={(value) => updateAdjustment("zoom", value)}
                step={0.01}
                value={Number(adjustments.zoom.toFixed(2))}
              />
              <AdjustmentSlider
                label="Horizontal Position"
                max={100}
                min={-100}
                onChange={(value) => updateAdjustment("offsetX", value)}
                step={1}
                value={adjustments.offsetX}
              />
              <AdjustmentSlider
                label="Vertical Position"
                max={100}
                min={-100}
                onChange={(value) => updateAdjustment("offsetY", value)}
                step={1}
                value={adjustments.offsetY}
              />
              <AdjustmentSlider
                label="Rotation"
                max={180}
                min={-180}
                onChange={(value) => updateAdjustment("rotation", value)}
                step={1}
                value={adjustments.rotation}
              />
            </div>
            <div
              className="rounded-lg border border-[var(--border)] bg-bg-surface text-text-secondary"
              style={{ padding: SPACING.md, fontSize: fontSizes.caption }}
            >
              The saved image is resized for faster local storage and cloud backup.
            </div>
            <div className="mt-auto flex items-center justify-between" style={{ gap: SPACING.md }}>
              <Button onClick={() => setAdjustments(defaultAdjustments)} variant="secondary">
                Reset
              </Button>
              <div className="flex items-center justify-end" style={{ gap: SPACING.md }}>
                <Button onClick={onClose} variant="secondary">
                  Cancel
                </Button>
                <Button
                  disabled={!imageElement || !!errorMessage || isLoading}
                  onClick={handleSave}
                  variant="navy"
                >
                  Save Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
