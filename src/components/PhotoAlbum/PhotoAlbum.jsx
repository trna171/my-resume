import { useEffect, useRef, useState } from "react";
import "./PhotoAlbum.css";

/**
 * 翻页相册：模拟真实相册翻页
 * - 每页：照片（或占位）+ 标题 + 时间/地点 + 一段小故事
 * - 点击左右箭头或键盘 ←/→ 翻页，带 3D 翻页动画
 * - 照片可用 `image` 字段指向真实图片；缺省时显示柔和色块占位
 */
export default function PhotoAlbum({ pages }) {
  const [index, setIndex] = useState(0);
  const [turning, setTurning] = useState(false);
  const dirRef = useRef(1);
  const total = pages.length;

  const go = (dir) => {
    if (turning) return;
    const next = index + dir;
    if (next < 0 || next >= total) return;
    dirRef.current = dir;
    setTurning(true);
    window.setTimeout(() => {
      setIndex(next);
      setTurning(false);
    }, 700);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, turning, total]);

  const page = pages[index];
  const dir = dirRef.current;

  return (
    <div className="album">
      <div className="album__viewport">
        <div
          key={index}
          className={`album-page${turning ? (dir > 0 ? " turning-next" : " turning-prev") : ""}`}
        >
          <div className="album-page__sheet">
            <div className="album-page__photo">
              {page.image ? (
                <img src={page.image} alt={page.title} />
              ) : (
                <div className="album-page__placeholder" style={{ "--tone": page.tone || "#d8d4c8" }}>
                  <span className="album-page__placeholder-label">PHOTO</span>
                  <span className="album-page__placeholder-title">{page.title}</span>
                </div>
              )}
            </div>
            <div className="album-page__caption">
              <h4>{page.title}</h4>
              {page.meta ? <p className="album-page__meta">{page.meta}</p> : null}
              <p className="album-page__story">{page.story}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="album__footer">
        <button
          type="button"
          className="album__nav album__nav--prev"
          onClick={() => go(-1)}
          disabled={index === 0 || turning}
          aria-label="上一页"
        />
        <div className="album__progress">
          <span className="album__counter">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className="album__track">
            <span
              className="album__fill"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </span>
        </div>
        <button
          type="button"
          className="album__nav album__nav--next"
          onClick={() => go(1)}
          disabled={index === total - 1 || turning}
          aria-label="下一页"
        />
      </div>
    </div>
  );
}
