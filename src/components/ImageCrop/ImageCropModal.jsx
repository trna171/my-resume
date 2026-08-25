import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ImageCropModal.css";

/**
 * 图片裁剪弹窗：上传图片后选择显示区域
 * - 裁剪框跟随原图比例（aspect 传数字可指定固定比例，默认 'original' 用原图比例）
 * - 拖动图片调整位置，滑块缩放
 * - 确认后用 canvas 裁出可见区域，输出 Blob
 */
export default function ImageCropModal({ imageSrc, aspect = "original", onCancel, onConfirm }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [size, setSize] = useState({ cw: 0, ch: 0 });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ iw: 0, ih: 0 });
  const [ready, setReady] = useState(false);
  const [hasAlpha, setHasAlpha] = useState(false); // 原图是否含透明通道（决定输出 PNG / JPEG）

  // 计算初始 cover 布局
  const initLayout = (cw, ch, iw, ih) => {
    const s0 = Math.max(cw / iw, ch / ih);
    const dw = iw * s0;
    const dh = ih * s0;
    return {
      s0,
      basePos: { x: (cw - dw) / 2, y: (ch - dh) / 2 }
    };
  };

  useEffect(() => {
    if (!imageSrc) return;
    // 换图时重置状态，回到「加载中…」
    setReady(false);
    setImgSize({ iw: 0, ih: 0 });
    const img = new Image();
    img.onload = () => {
      // 先记录原图尺寸，触发重渲染让舞台按原图比例布局
      setImgSize({ iw: img.naturalWidth, ih: img.naturalHeight });
      // 廉价透明检测：缩略采样看是否有半透明像素（决定输出 PNG 还是 JPEG）
      try {
        const probe = document.createElement("canvas");
        probe.width = 32;
        probe.height = 32;
        const pctx = probe.getContext("2d", { willReadFrequently: true });
        pctx.drawImage(img, 0, 0, 32, 32);
        const data = pctx.getImageData(0, 0, 32, 32).data;
        let alpha = false;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 250) {
            alpha = true;
            break;
          }
        }
        setHasAlpha(alpha);
      } catch {
        setHasAlpha(false);
      }
    };
    img.src = imageSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  // 原图尺寸就绪、舞台已按目标比例渲染后，读取实际尺寸并初始化布局
  useEffect(() => {
    if (!imgSize.iw || !imgSize.ih) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const cw = wrap.clientWidth;
    const ch = wrap.clientHeight;
    const { basePos } = initLayout(cw, ch, imgSize.iw, imgSize.ih);
    setSize({ cw, ch });
    // 初始 scale 记为 1（相对 cover），把 basePos 存入
    scaleRef.current = 1;
    setPos(basePos);
    setScale(1);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSize.iw, imgSize.ih]);

  const scaleRef = useRef(1);

  // 拖动：preventDefault 阻止浏览器原生图片拖拽 / 文本选择，避免与拖动冲突
  const onPointerDown = (event) => {
    if (!ready) return;
    event.preventDefault();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: pos.x,
      originY: pos.y
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* 合成事件下忽略 */
    }
  };

  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    event.preventDefault();
    const { startX, startY, originX, originY } = dragRef.current;
    setPos(clampPos(originX + event.clientX - startX, originY + event.clientY - startY));
  };

  // 阻止拖拽结束后浏览器的图片拖放默认行为
  const onDragStart = (event) => {
    event.preventDefault();
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const clampPos = (x, y) => {
    const { cw, ch } = size;
    const { iw, ih } = imgSize;
    const s = scaleRef.current;
    const dw = iw * s0() * s;
    const dh = ih * s0() * s;
    const minX = Math.min(0, cw - dw);
    const minY = Math.min(0, ch - dh);
    return {
      x: Math.min(0, Math.max(minX, x)),
      y: Math.min(0, Math.max(minY, y))
    };
  };

  const s0 = () => Math.max(size.cw / imgSize.iw, size.ch / imgSize.ih);

  // 缩放：围绕容器中心
  const handleScale = (value) => {
    const next = value;
    const prev = scaleRef.current;
    const k = next / prev;
    const { cw, ch } = size;
    setPos((p) => clampPos(cw / 2 - (cw / 2 - p.x) * k, ch / 2 - (ch / 2 - p.y) * k));
    scaleRef.current = next;
    setScale(next);
  };

  // 确认裁剪：canvas 输出可见区域
  // ⚠️ 输出分辨率 = 裁剪区域在【原图坐标系】中的像素尺寸（sw×sh），而不是舞台显示尺寸
  // 否则高分辨率原图会被压成几百像素，显示时放大变模糊。
  const confirm = () => {
    const { cw, ch } = size;
    const { iw, ih } = imgSize;
    const s = scaleRef.current * s0();
    const sx = -pos.x / s;
    const sy = -pos.y / s;
    const sw = cw / s; // 原图像素下的裁剪宽
    const sh = ch / s; // 原图像素下的裁剪高
    let outW = Math.max(1, Math.round(sw));
    let outH = Math.max(1, Math.round(sh));
    // 最大边限制：防止超大原图输出过大的文件（2560 已远超网页显示需求）
    const MAX_EDGE = 2560;
    const longest = Math.max(outW, outH);
    if (longest > MAX_EDGE) {
      const k = MAX_EDGE / longest;
      outW = Math.round(outW * k);
      outH = Math.round(outH * k);
    }
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    // 有透明通道 → PNG（保留透明）；普通照片 → JPEG 0.92（体积小且清晰）
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      hasAlpha ? "image/png" : "image/jpeg",
      hasAlpha ? undefined : 0.92
    );
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  if (!imageSrc) return null;

  const { iw, ih } = imgSize;
  const s = s0() * scale;
  const dw = iw * s;
  const dh = ih * s;
  // 裁剪框比例：指定数字则用固定比例，默认跟随原图比例
  const cropRatio = typeof aspect === "number" ? aspect : iw / ih || 4 / 3;

  // Portal 到 body：避免祖先 transform（入场动画）改变 fixed 包含块导致弹窗偏移
  return createPortal(
    <div className="crop-modal" role="dialog" aria-modal="true" aria-label="调整图片显示区域" onClick={onCancel}>
      <div className="crop-modal__box" onClick={(event) => event.stopPropagation()}>
        <div className="crop-modal__head">
          <h4>调整显示区域</h4>
          <p>显示区域跟随原图比例 · 拖动调整位置，滑块缩放</p>
        </div>

        <div
          ref={wrapRef}
          className="crop-modal__stage"
          style={{ "--crop-ratio": cropRatio }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {ready ? (
            <>
              <img
                ref={imgRef}
                src={imageSrc}
                alt="待裁剪"
                draggable={false}
                onDragStart={onDragStart}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: dw,
                  height: dh,
                  maxWidth: "none",
                  cursor: "grab",
                  userSelect: "none",
                  WebkitUserDrag: "none",
                  touchAction: "none",
                  pointerEvents: "none"
                }}
              />
              {/* 三分法辅助线 */}
              <div className="crop-modal__grid" aria-hidden="true">
                <span className="crop-modal__grid-v v1" />
                <span className="crop-modal__grid-v v2" />
                <span className="crop-modal__grid-h h1" />
                <span className="crop-modal__grid-h h2" />
              </div>
            </>
          ) : (
            <p className="crop-modal__loading">加载中…</p>
          )}
        </div>

        <div className="crop-modal__controls">
          <span className="crop-modal__zoom-label">缩放</span>
          <input
            className="crop-modal__zoom"
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={scale}
            disabled={!ready}
            onChange={(event) => handleScale(Number(event.target.value))}
            aria-label="缩放"
          />
          <span className="crop-modal__zoom-value">{Math.round(scale * 100)}%</span>
        </div>

        <div className="crop-modal__actions">
          <button className="button button-secondary" type="button" onClick={onCancel}>
            取消
          </button>
          <button className="button button-primary" type="button" onClick={confirm} disabled={!ready}>
            应用
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
