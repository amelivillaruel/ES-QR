(function () {
  const QR_RESOLUTION = 512;
  const QR_PADDING = 32;

  const urlInput = document.getElementById("urlInput");
  const clearBtn = document.getElementById("clearBtn");
  const qrStage = document.getElementById("qrStage");
  const emptyState = document.getElementById("emptyState");
  const qrOutput = document.getElementById("qrOutput");
  const qrCanvas = document.getElementById("qrCanvas");
  const qrPreviewUrl = document.getElementById("qrPreviewUrl");
  const actionsRow = document.getElementById("actionsRow");
  const downloadBtn = document.getElementById("downloadBtn");
  const downloadIcon = document.getElementById("downloadIcon");
  const downloadLabel = document.getElementById("downloadLabel");
  const copyBtn = document.getElementById("copyBtn");
  const copyLabel = document.getElementById("copyLabel");
  const copyIcon = document.getElementById("copyIcon");
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const toastEl = document.getElementById("liveToast");
  const toastIcon = document.getElementById("toastIcon");
  const toastMessage = document.getElementById("toastMessage");

  let qrInstance = null;
  let bsToast = null;
  let copyResetTimeout = null;
  let downloadResetTimeout = null;

  function initTheme() {
    let theme = "light";
    try {
      const stored = localStorage.getItem("qr_studio_bs_theme");
      if (stored === "dark" || stored === "light") {
        theme = stored;
      } else if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        theme = "dark";
      }
    } catch (e) {}
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    themeIcon.className =
      theme === "dark"
        ? "bi bi-sun-fill text-warning"
        : "bi bi-moon-stars-fill";
  }

  function toggleTheme() {
    const current =
      document.documentElement.getAttribute("data-bs-theme") === "dark"
        ? "dark"
        : "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("qr_studio_bs_theme", next);
    } catch (e) {}
  }

  function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toastIcon.className = isError
      ? "bi bi-exclamation-circle-fill text-danger"
      : "bi bi-check-circle-fill text-success";

    if (!bsToast && window.bootstrap) {
      bsToast = new bootstrap.Toast(toastEl, { delay: 2800 });
    }
    if (bsToast) {
      bsToast.show();
    }
  }

  function handleInputUpdate() {
    const value = urlInput.value.trim();

    clearBtn.classList.toggle("d-none", urlInput.value.length === 0);

    if (!value) {
      emptyState.classList.remove("d-none");
      emptyState.classList.add("d-flex");
      qrOutput.classList.add("d-none");
      qrOutput.classList.remove("d-flex");
      actionsRow.classList.add("d-none");
      qrStage.style.borderStyle = "dashed";
      return;
    }

    emptyState.classList.add("d-none");
    emptyState.classList.remove("d-flex");
    qrOutput.classList.remove("d-none");
    qrOutput.classList.add("d-flex");
    actionsRow.classList.remove("d-none");
    qrStage.style.borderStyle = "solid";
    qrPreviewUrl.textContent = value;

    try {
      if (!qrInstance) {
        qrInstance = new QRious({
          element: qrCanvas,
          value: value,
          size: QR_RESOLUTION,
          level: "M",
          foreground: "#000000",
          background: "#ffffff",
          padding: QR_PADDING,
        });
      } else {
        qrInstance.set({
          value: value,
          size: QR_RESOLUTION,
          level: "M",
          foreground: "#000000",
          background: "#ffffff",
          padding: QR_PADDING,
        });
      }
    } catch (err) {
      console.error("Error al generar el código QR:", err);
      showToast("No se pudo generar el código QR.", true);
    }
  }

  function downloadQR() {
    if (!urlInput.value.trim()) return;

    try {
      const dataUrl = qrCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "codigo-qr.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      downloadBtn.classList.replace("btn-primary", "btn-su  ccess");
      downloadIcon.className = "bi bi-check2";
      downloadLabel.textContent = "¡Descargado!";

      clearTimeout(downloadResetTimeout);
      downloadResetTimeout = setTimeout(() => {
        downloadBtn.classList.replace("btn-success", "btn-primary");
        downloadIcon.className = "bi bi-download";
        downloadLabel.textContent = "Descargar QR   ";
      }, 2000);

      showToast("Imagen PNG descargada (512 × 512 px)");
    } catch (err) {
      console.error("Error al descargar PNG:", err);
      showToast("No se pudo descargar el archivo PNG.", true);
    }
  }

  async function copyQR() {
    if (!urlInput.value.trim()) return;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blob = await new Promise((resolve) =>
          qrCanvas.toBlob(resolve, "image/png"),
        );
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          triggerCopyFeedback();
          return;
        }
      }
      fallbackCopyImage();
    } catch (err) {
      fallbackCopyImage();
    }
  }

  function fallbackCopyImage() {
    try {
      const dataUrl = qrCanvas.toDataURL("image/png");
      const container = document.createElement("div");
      container.contentEditable = "true";
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.opacity = "0";

      const img = document.createElement("img");
      img.src = dataUrl;
      container.appendChild(img);
      document.body.appendChild(container);

      const range = document.createRange();
      range.selectNode(img);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const success = document.execCommand("copy");
      selection.removeAllRanges();
      document.body.removeChild(container);

      if (success) {
        triggerCopyFeedback();
      } else {
        showToast(
          'El navegador restringió el copiado directo. Usa "Descargar PNG".',
          true,
        );
      }
    } catch (err) {
      console.error("Error al copiar imagen:", err);
      showToast('No se pudo copiar. Usa "Descargar PNG".', true);
    }
  }

  function triggerCopyFeedback() {
    copyBtn.classList.replace("btn-outline-secondary", "btn-success");
    copyIcon.className = "bi bi-check2";
    copyLabel.textContent = "¡QR copiado!";
    showToast("Código QR copiado al portapapeles");

    clearTimeout(copyResetTimeout);
    copyResetTimeout = setTimeout(() => {
      copyBtn.classList.replace("btn-success", "btn-outline-secondary");
      copyIcon.className = "bi bi-clipboard";
      copyLabel.textContent = "Copiar QR";
    }, 2200);
  }

  window.addEventListener("DOMContentLoaded", () => {
    initTheme();
    handleInputUpdate();

    urlInput.addEventListener("input", handleInputUpdate);

    clearBtn.addEventListener("click", () => {
      urlInput.value = "";
      handleInputUpdate();
      urlInput.focus();
    });

    downloadBtn.addEventListener("click", downloadQR);
    copyBtn.addEventListener("click", copyQR);
    themeToggle.addEventListener("click", toggleTheme);
  });
})();
