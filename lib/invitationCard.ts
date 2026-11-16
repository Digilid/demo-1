import { BLESSING, COUPLE, EVENTS, VENUE, WEDDING } from '@/constants/weddingData';

/** Draws a print-quality Kasavu-bordered invitation card and downloads it as PNG. */
export async function downloadInvitationCard() {
  await document.fonts?.ready;
  const W = 1200;
  const H = 1800;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  // background: deep maroon with a warm lamp glow
  const bg = ctx.createRadialGradient(W / 2, H * 0.38, 50, W / 2, H * 0.45, H * 0.8);
  bg.addColorStop(0, '#8a1f24');
  bg.addColorStop(0.55, '#5a1016');
  bg.addColorStop(1, '#1e0807');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Kasavu borders
  const gold = ctx.createLinearGradient(0, 0, W, H);
  gold.addColorStop(0, '#f6e3a1');
  gold.addColorStop(0.5, '#d4af37');
  gold.addColorStop(1, '#a7801c');
  ctx.strokeStyle = gold;
  ctx.lineWidth = 14;
  ctx.strokeRect(46, 46, W - 92, H - 92);
  ctx.lineWidth = 3;
  ctx.strokeRect(74, 74, W - 148, H - 148);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(86, 86, W - 172, H - 172);
  // temple-tower motif along the inner border
  ctx.fillStyle = 'rgba(212,175,55,0.55)';
  for (let x = 110; x < W - 110; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 104);
    ctx.lineTo(x + 18, 120);
    ctx.lineTo(x + 36, 104);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, H - 104);
    ctx.lineTo(x + 18, H - 120);
    ctx.lineTo(x + 36, H - 104);
    ctx.fill();
  }

  const center = (text: string, y: number, font: string, color: string | CanvasGradient = '#faf3e0') => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, y);
  };

  // nilavilakku glyph
  ctx.save();
  ctx.translate(W / 2, 250);
  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.ellipse(0, 60, 70, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-6, -10, 12, 70);
  ctx.beginPath();
  ctx.ellipse(0, -14, 56, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  const flame = ctx.createRadialGradient(0, -52, 2, 0, -46, 40);
  flame.addColorStop(0, 'rgba(255,245,200,1)');
  flame.addColorStop(0.4, 'rgba(255,170,60,0.9)');
  flame.addColorStop(1, 'rgba(255,120,20,0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.ellipse(0, -48, 30, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  center(BLESSING.malayalam, 380, '500 44px "Noto Serif Malayalam", serif', gold);
  center(BLESSING.invocation.toUpperCase(), 440, '500 24px "Cormorant Garamond", serif', '#e9dcc0');
  center('together with their families', 520, 'italic 34px "Cormorant Garamond", serif', '#e9dcc0');

  center(COUPLE.groom.fullName, 640, '600 96px "Cormorant Garamond", serif', gold);
  center('&', 740, 'italic 64px "Cormorant Garamond", serif', '#faf3e0');
  center(COUPLE.bride.fullName, 840, '600 96px "Cormorant Garamond", serif', gold);

  center(COUPLE.groom.parents, 940, '400 26px "Cormorant Garamond", serif', '#e9dcc0');
  center(COUPLE.bride.parents, 980, '400 26px "Cormorant Garamond", serif', '#e9dcc0');

  center('request the honour of your presence', 1060, 'italic 34px "Cormorant Garamond", serif', '#faf3e0');

  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 1120);
  ctx.lineTo(900, 1120);
  ctx.stroke();

  center(WEDDING.displayDate, 1180, '600 48px "Cormorant Garamond", serif', '#faf3e0');
  center(WEDDING.malayalamMonth, 1232, '400 28px "Cormorant Garamond", serif', '#e9dcc0');

  let y = 1320;
  for (const ev of EVENTS) {
    center(`${ev.title}  ·  ${ev.timeLabel}`, y, '600 32px "Cormorant Garamond", serif', gold);
    center(ev.venue, y + 40, '400 26px "Cormorant Garamond", serif', '#e9dcc0');
    y += 100;
  }

  center(VENUE.address, H - 190, '400 24px "Cormorant Garamond", serif', '#e9dcc0');
  center(COUPLE.hashtag, H - 145, '600 30px "Cormorant Garamond", serif', gold);

  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${COUPLE.groom.name}-${COUPLE.bride.name}-Invitation.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
