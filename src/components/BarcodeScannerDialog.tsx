"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => Promise<void> | void;
}

const scannerElementId = "barcode-scanner-region";
const permissionDeniedMessage =
  "Camera access is required to scan barcodes. Please allow camera in your browser settings.";

/** Returns a user-facing permission error when the scanner UI reports one. */
function getCameraErrorMessage(scannerText: string): string | null {
  const normalizedText = scannerText.toLowerCase();
  if (normalizedText.includes("notallowederror")) {
    return permissionDeniedMessage;
  }

  if (normalizedText.includes("permission") && normalizedText.includes("denied")) {
    return permissionDeniedMessage;
  }

  if (normalizedText.includes("secure context")) {
    return permissionDeniedMessage;
  }

  return null;
}

/** Syncs the native dialog open state with the component prop. */
function useDialogVisibility(
  dialogReference: React.RefObject<HTMLDialogElement>,
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

/** Clears the active scanner instance and empties the scanner container. */
async function clearScanner(
  scannerReference: React.MutableRefObject<{ clear: () => Promise<void> } | null>,
) {
  const scannerInstance = scannerReference.current;
  scannerReference.current = null;

  if (!scannerInstance) {
    return;
  }

  try {
    await scannerInstance.clear();
  } catch {
    // Swallow cleanup errors so the dialog can always close cleanly.
  }
}

/** Observes scanner UI text and surfaces permission issues as a friendly message. */
function observeScannerMessages(
  containerElement: HTMLDivElement,
  onCameraError: (message: string | null) => void,
) {
  function updateCameraError() {
    onCameraError(getCameraErrorMessage(containerElement.innerText));
  }

  const observer = new MutationObserver(updateCameraError);
  observer.observe(containerElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  updateCameraError();

  return () => observer.disconnect();
}

/** Renders the barcode scanner dialog and manages scanner mount and cleanup. */
export function BarcodeScannerDialog({
  isOpen,
  onClose,
  onScan,
}: BarcodeScannerDialogProps) {
  const dialogReference = useRef<HTMLDialogElement | null>(null);
  const scannerContainerReference = useRef<HTMLDivElement | null>(null);
  const scannerReference = useRef<{ clear: () => Promise<void> } | null>(null);
  const hasHandledScanReference = useRef(false);
  const onScanReference = useRef(onScan);
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);

  onScanReference.current = onScan;
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
    const scannerContainerElement = scannerContainerReference.current;
    if (!isOpen || !scannerContainerElement) {
      return;
    }

    let isDisposed = false;
    let stopObservingMessages = () => {};

    async function initializeScanner() {
      const html5QrcodeModule = await import("html5-qrcode");
      if (isDisposed || !scannerContainerReference.current) {
        return;
      }

      hasHandledScanReference.current = false;
      setCameraErrorMessage(null);

      const scanner = new html5QrcodeModule.Html5QrcodeScanner(
        scannerElementId,
        {
          fps: 10,
          qrbox: { width: 280, height: 140 },
          rememberLastUsedCamera: false,
          showTorchButtonIfSupported: true,
          supportedScanTypes: [html5QrcodeModule.Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        },
        false,
      );

      stopObservingMessages = observeScannerMessages(
        scannerContainerReference.current,
        setCameraErrorMessage,
      );
      scannerReference.current = scanner;
      scanner.render((decodedText) => {
        if (hasHandledScanReference.current) {
          return;
        }

        hasHandledScanReference.current = true;
        void onScanReference.current(decodedText);
      }, () => {});
    }

    void initializeScanner();
    return () => {
      isDisposed = true;
      stopObservingMessages();
      if (scannerContainerReference.current) {
        scannerContainerReference.current.innerHTML = "";
      }
      void clearScanner(scannerReference);
    };
  }, [isOpen]);

  return (
    <dialog
      className="w-full max-w-3xl border border-[var(--border)] bg-bg-primary text-text-primary backdrop:bg-black/50"
      ref={dialogReference}
      style={{ borderRadius: RADIUS.lg, padding: 0 }}
    >
      <div style={{ padding: SPACING.xl }}>
        <div className="flex items-start justify-between" style={{ gap: SPACING.lg }}>
          <div>
            <h2 style={{ fontSize: fontSizes.title, fontWeight: fontWeights.bold }}>
              Scan Barcode
            </h2>
            <p className="text-text-secondary" style={{ fontSize: fontSizes.body }}>
              Allow camera access, then scan a product barcode to add it to the cart.
            </p>
          </div>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
        <div style={{ marginTop: SPACING.xl }}>
          <div
            className="overflow-hidden border border-[var(--border)] bg-bg-surface"
            id={scannerElementId}
            ref={scannerContainerReference}
            style={{
              borderRadius: RADIUS.md,
              minHeight: LAYOUT.minClickTarget * 6,
              padding: SPACING.md,
            }}
          />
          {cameraErrorMessage ? (
            <p
              className="text-danger"
              style={{ fontSize: fontSizes.body, marginTop: SPACING.md }}
            >
              {cameraErrorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
