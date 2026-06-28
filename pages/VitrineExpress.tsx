import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Sale } from '../types';
import { Sparkles, Zap, Copy, Download, RefreshCw, Check, Flame, MessageSquare, Info, ChevronRight } from 'lucide-react';

interface VitrineExpressProps {
  products: Product[];
  sales: Sale[];
}

interface Suggestion {
  productId: string;
  productName: string;
  tag: 'parado' | 'estoque_alto' | 'margem_boa' | 'mais_vendido';
  reason: string;
  originalPrice: number;
  promoPrice: number;
  stockQuantity: number;
  emoji: string;
}

export const VitrineExpress: React.FC<VitrineExpressProps> = ({ products, sales }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [copied, setCopied] = useState(false);
  const [promoPricesStr, setPromoPricesStr] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Analysis function to select recommendations
  const generateSuggestions = () => {
    if (!products || products.length === 0) {
      setSuggestions([]);
      return;
    }

    const inStock = products.filter(p => p.stockQuantity > 0);
    if (inStock.length === 0) {
      setSuggestions([]);
      return;
    }

    // Sales in the last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentSales = sales.filter(s => new Date(s.date).getTime() > thirtyDaysAgo);

    const recentQtyMap: Record<string, number> = {};
    recentSales.forEach(s => {
      s.items.forEach(item => {
        recentQtyMap[item.productId] = (recentQtyMap[item.productId] || 0) + item.quantity;
      });
    });

    // Last sale date all time
    const lastSaleDateMap: Record<string, number> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const time = new Date(s.date).getTime();
        if (!lastSaleDateMap[item.productId] || time > lastSaleDateMap[item.productId]) {
          lastSaleDateMap[item.productId] = time;
        }
      });
    });

    const list: Suggestion[] = [];
    const usedIds = new Set<string>();

    const getSafePromoPrice = (p: Product, discountPercent: number) => {
      const discounted = p.sellPrice * (1 - discountPercent / 100);
      const minSafePrice = p.costPrice * 1.1; // cost + 10%
      return Math.max(discounted, minSafePrice);
    };

    // Category emojis
    const getEmojiForProduct = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('batom') || n.includes('gloss') || n.includes('labial')) return '💋';
      if (n.includes('base') || n.includes('po') || n.includes('corretivo')) return '💄';
      if (n.includes('creme') || n.includes('hidratante') || n.includes('facial') || n.includes('serum')) return '🧴';
      if (n.includes('perfume') || n.includes('colonia') || n.includes('fragrancia')) return '✨';
      if (n.includes('rimel') || n.includes('mascara') || n.includes('olhos') || n.includes('delineador')) return '👁️';
      return '🌸';
    };

    // 1. Mais Vendido (Best Seller)
    const sortedBySales = [...inStock].sort((a, b) => (recentQtyMap[b.id] || 0) - (recentQtyMap[a.id] || 0));
    const bestSeller = sortedBySales[0];
    if (bestSeller && (recentQtyMap[bestSeller.id] || 0) > 0) {
      list.push({
        productId: bestSeller.id,
        productName: bestSeller.name,
        tag: 'mais_vendido',
        reason: 'O mais vendido no último mês!',
        originalPrice: bestSeller.sellPrice,
        promoPrice: getSafePromoPrice(bestSeller, 5),
        stockQuantity: bestSeller.stockQuantity,
        emoji: getEmojiForProduct(bestSeller.name)
      });
      usedIds.add(bestSeller.id);
    }

    // 2. Produto Parado (Unsold)
    const sortedByUnsold = [...inStock]
      .filter(p => !usedIds.has(p.id))
      .sort((a, b) => {
        const dateA = lastSaleDateMap[a.id] || 0;
        const dateB = lastSaleDateMap[b.id] || 0;
        return dateA - dateB; // oldest sale first
      });

    const unsoldProduct = sortedByUnsold[0];
    if (unsoldProduct) {
      const lastSold = lastSaleDateMap[unsoldProduct.id];
      const isParado = !lastSold || (Date.now() - lastSold > 20 * 24 * 60 * 60 * 1000);
      list.push({
        productId: unsoldProduct.id,
        productName: unsoldProduct.name,
        tag: 'parado',
        reason: isParado ? 'Sem vendas há mais de 20 dias. Hora de girar!' : 'Produto com menor frequência de saída.',
        originalPrice: unsoldProduct.sellPrice,
        promoPrice: getSafePromoPrice(unsoldProduct, 20),
        stockQuantity: unsoldProduct.stockQuantity,
        emoji: getEmojiForProduct(unsoldProduct.name)
      });
      usedIds.add(unsoldProduct.id);
    }

    // 3. Estoque Alto (High Stock)
    const sortedByStock = [...inStock]
      .filter(p => !usedIds.has(p.id))
      .sort((a, b) => b.stockQuantity - a.stockQuantity);

    const highStockProduct = sortedByStock[0];
    if (highStockProduct) {
      list.push({
        productId: highStockProduct.id,
        productName: highStockProduct.name,
        tag: 'estoque_alto',
        reason: `Possui quantidade expressiva (${highStockProduct.stockQuantity} un) em estoque.`,
        originalPrice: highStockProduct.sellPrice,
        promoPrice: getSafePromoPrice(highStockProduct, 15),
        stockQuantity: highStockProduct.stockQuantity,
        emoji: getEmojiForProduct(highStockProduct.name)
      });
      usedIds.add(highStockProduct.id);
    }

    // 4. Margem Boa (Good Profit Margin)
    const sortedByMargin = [...inStock]
      .filter(p => !usedIds.has(p.id))
      .sort((a, b) => {
        const marginA = (a.sellPrice - a.costPrice) / a.sellPrice;
        const marginB = (b.sellPrice - b.costPrice) / b.sellPrice;
        return marginB - marginA;
      });

    const highMarginProduct = sortedByMargin[0];
    if (highMarginProduct) {
      list.push({
        productId: highMarginProduct.id,
        productName: highMarginProduct.name,
        tag: 'margem_boa',
        reason: 'Margem de lucro alta, excelente para descontos.',
        originalPrice: highMarginProduct.sellPrice,
        promoPrice: getSafePromoPrice(highMarginProduct, 10),
        stockQuantity: highMarginProduct.stockQuantity,
        emoji: getEmojiForProduct(highMarginProduct.name)
      });
      usedIds.add(highMarginProduct.id);
    }

    // Fallbacks if list is too short
    let fallbackIdx = 0;
    while (list.length < Math.min(inStock.length, 4) && fallbackIdx < inStock.length) {
      const p = inStock[fallbackIdx];
      if (!usedIds.has(p.id)) {
        list.push({
          productId: p.id,
          productName: p.name,
          tag: 'margem_boa',
          reason: 'Sugestão do catálogo diário.',
          originalPrice: p.sellPrice,
          promoPrice: getSafePromoPrice(p, 10),
          stockQuantity: p.stockQuantity,
          emoji: getEmojiForProduct(p.name)
        });
        usedIds.add(p.id);
      }
      fallbackIdx++;
    }

    setSuggestions(list);
    const initialPricesStr: Record<string, string> = {};
    list.forEach(item => {
      initialPricesStr[item.productId] = String(item.promoPrice).replace('.', ',');
    });
    setPromoPricesStr(initialPricesStr);
    setHasGenerated(true);
  };

  const handlePromoPriceInputChange = (index: number, productId: string, val: string) => {
    if (val === '' || /^[0-9]+[.,]?[0-9]*$/.test(val) || val === ',' || val === '.') {
      setPromoPricesStr(prev => ({ ...prev, [productId]: val }));
      const normalized = val.replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num)) {
        const updated = [...suggestions];
        updated[index].promoPrice = num;
        setSuggestions(updated);
      }
    }
  };

  const handlePromoPriceBlur = (index: number, productId: string) => {
    const item = suggestions[index];
    const originalProd = products.find(p => p.id === item.productId);
    if (originalProd) {
      const minPrice = originalProd.costPrice;
      if (item.promoPrice < minPrice) {
        alert(`O valor promocional não pode ser menor que o preço de custo (R$ ${minPrice.toFixed(2)})!`);
        const resetVal = Math.max(item.originalPrice * 0.9, minPrice);
        const updated = [...suggestions];
        updated[index].promoPrice = resetVal;
        setSuggestions(updated);
        setPromoPricesStr(prev => ({ ...prev, [productId]: String(resetVal).replace('.', ',') }));
      }
    }
  };

  const handleUpdatePrice = (index: number, val: number) => {
    const updated = [...suggestions];
    const item = updated[index];
    const originalProd = products.find(p => p.id === item.productId);
    
    // Safety check: don't allow price to fall below cost
    if (originalProd) {
      const minPrice = originalProd.costPrice;
      if (val < minPrice) {
        alert(`O valor promocional não pode ser menor que o preço de custo (R$ ${minPrice.toFixed(2)})!`);
        return;
      }
    }
    
    item.promoPrice = val;
    setSuggestions(updated);
  };

  const handleUpdateEmoji = (index: number, val: string) => {
    const updated = [...suggestions];
    updated[index].emoji = val;
    setSuggestions(updated);
  };

  // Generate WhatsApp Text format
  const whatsAppText = useMemo(() => {
    if (suggestions.length === 0) return '';
    let text = `✨ *OFERTAS DE HOJE - FLUXO BEAUTY* ✨\n`;
    text += `✨ _Produtos selecionados com descontos especiais para você!_\n\n`;

    suggestions.forEach(item => {
      const hasDiscount = item.promoPrice < item.originalPrice;
      const savings = item.originalPrice - item.promoPrice;
      const priceText = hasDiscount
        ? `de ~R$ ${item.originalPrice.toFixed(2)}~ por *R$ ${item.promoPrice.toFixed(2)}*`
        : `*R$ ${item.originalPrice.toFixed(2)}*`;

      let label = '';
      if (item.tag === 'mais_vendido') label = '🔥 _Mais Vendido_';
      else if (item.tag === 'parado') label = '🚀 _Promoção Relâmpago_';
      else if (item.tag === 'estoque_alto') label = '💎 _Oportunidade do Dia_';
      else label = '🎁 _Oferta Exclusiva_';

      let stockText = '';
      if (item.stockQuantity === 1) {
        stockText = '🔴 Última Unidade!';
      } else if (item.stockQuantity === 2) {
        stockText = '🟠 Restam apenas 2 unidades!';
      } else if (item.stockQuantity <= 5) {
        stockText = '🟡 Estoque Limitado!';
      } else {
        stockText = `📦 ${item.stockQuantity} un disponíveis`;
      }

      text += `${item.emoji} *${item.productName.toUpperCase()}*\n`;
      text += `💰 ${priceText}`;
      if (hasDiscount && savings > 0) {
        text += ` (Economize R$ ${savings.toFixed(2)})`;
      }
      text += `\n`;
      text += `🏷️ ${label} • ${stockText}\n\n`;
      text += `━━━━━━━━━━\n\n`;
    });

    text += `🚚 *Pronta entrega para toda a região!*\n`;
    text += `✨ *Produtos disponíveis para envio imediato!*\n`;
    text += `📦 *Estoque atualizado em tempo real!*\n\n`;
    text += `💖 *Faça seu pedido enquanto ainda há disponibilidade!*`;
    return text;
  }, [suggestions]);


  // Copy text handler
  const handleCopyText = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Draw flyer canvas
  const renderFlyer = () => {
    const canvas = canvasRef.current;
    if (!canvas || suggestions.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size (increased height to prevent crowding and fit elegant footer/header)
    canvas.width = 800;
    canvas.height = 1300;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#2D0B14'); // Rich dark wine
    grad.addColorStop(0.5, '#420F1D'); // Deep wine
    grad.addColorStop(1, '#1A0409'); // Darkest wine
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Helper to draw 4-pointed sparkle stars
    const drawSparkle = (cx: number, cy: number, size: number) => {
      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      ctx.moveTo(cx, cy - size);
      ctx.quadraticCurveTo(cx, cy, cx + size, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy + size);
      ctx.quadraticCurveTo(cx, cy, cx - size, cy);
      ctx.quadraticCurveTo(cx, cy, cx, cy - size);
      ctx.closePath();
      ctx.fill();
    };

    // Draw header sparkle details
    drawSparkle(75, 80, 10);
    drawSparkle(725, 80, 10);
    drawSparkle(85, 140, 15);
    drawSparkle(715, 140, 15);
    drawSparkle(180, 115, 8);
    drawSparkle(620, 115, 8);

    // Decorative Gold border
    ctx.strokeStyle = '#D4AF37'; // Gold
    ctx.lineWidth = 6;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

    // Inner thin border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

    // Top Header Brand
    ctx.fillStyle = '#D4AF37';
    ctx.font = '900 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '10px';
    ctx.fillText('FLUXO BEAUTY', canvas.width / 2, 85);

    // Main Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 46px sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('OFERTAS DE HOJE', canvas.width / 2, 140);

    // Header Subtitle (New requirement)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = 'italic 500 14px sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('Produtos selecionados automaticamente com as melhores oportunidades do dia', canvas.width / 2, 175);

    // Subtitle Date Pill with Calendar Icon
    const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
    const dateText = `📅 ${todayStr}`;
    ctx.font = 'bold 13px sans-serif';
    ctx.letterSpacing = '3px';
    const pillWidth = ctx.measureText(dateText).width + 40;
    const pillHeight = 36;
    const pillX = (canvas.width - pillWidth) / 2;
    const pillY = 202;

    // Draw pill background
    ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 18);
    } else {
      ctx.arc(pillX + 18, pillY + 18, 18, Math.PI, Math.PI * 1.5);
      ctx.lineTo(pillX + pillWidth - 18, pillY);
      ctx.arc(pillX + pillWidth - 18, pillY + 18, 18, Math.PI * 1.5, 0);
      ctx.lineTo(pillX + pillWidth, pillY + pillHeight - 18);
      ctx.arc(pillX + pillWidth - 18, pillY + pillHeight - 18, 18, 0, Math.PI * 0.5);
      ctx.lineTo(pillX + 18, pillY + pillHeight);
      ctx.arc(pillX + 18, pillY + pillHeight - 18, 18, Math.PI * 0.5, Math.PI);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    // Draw Date Text
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'center';
    ctx.fillText(dateText, canvas.width / 2, pillY + 22);

    // Divider Line
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 260);
    ctx.lineTo(canvas.width - 150, 260);
    ctx.stroke();

    // Render items
    let startY = 285;
    const itemHeight = 195;
    const itemGap = 15;

    suggestions.forEach((item, idx) => {
      const y = startY + idx * (itemHeight + itemGap);
      const cardWidth = 660;
      const cardX = 70;

      // Draw item card background
      const cardGrad = ctx.createLinearGradient(cardX, y, cardX + cardWidth, y);
      cardGrad.addColorStop(0, '#420F1D'); // Solid wine
      cardGrad.addColorStop(1, '#2D0B14'); // Rich dark wine
      ctx.fillStyle = cardGrad;
      
      // Draw rounded card
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(cardX, y, cardWidth, itemHeight, 20);
      } else {
        ctx.arc(cardX + 20, y + 20, 20, Math.PI, Math.PI * 1.5);
        ctx.lineTo(cardX + cardWidth - 20, y);
        ctx.arc(cardX + cardWidth - 20, y + 20, 20, Math.PI * 1.5, 0);
        ctx.lineTo(cardX + cardWidth, y + itemHeight - 20);
        ctx.arc(cardX + cardWidth - 20, y + itemHeight - 20, 20, 0, Math.PI * 0.5);
        ctx.lineTo(cardX + 20, y + itemHeight);
        ctx.arc(cardX + 20, y + itemHeight - 20, 20, Math.PI * 0.5, Math.PI);
        ctx.closePath();
      }
      ctx.fill();

      // Card border
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Left Circle Container for Icons (High Contrast)
      const circleX = cardX + 65;
      const circleY = y + (itemHeight / 2);
      const radius = 45;

      ctx.fillStyle = '#FFFDF9'; // Soft cream
      ctx.beginPath();
      ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#D4AF37'; // Gold
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw emoji inside the circle
      ctx.font = '45px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji, circleX, circleY + 2);

      // Reset baseline
      ctx.textBaseline = 'alphabetic';

      // Product details
      const infoX = cardX + 135;

      // 1. Product Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 20px sans-serif';
      ctx.textAlign = 'left';
      
      let nameToDraw = item.productName.toUpperCase();
      if (ctx.measureText(nameToDraw).width > 240) {
        nameToDraw = nameToDraw.slice(0, 22) + '...';
      }
      ctx.fillText(nameToDraw, infoX, y + 42);

      // 2. Promotional Badge (Tag Label)
      let badgeText = '';
      let badgeColor = '#D4AF37';
      if (item.tag === 'mais_vendido') {
        badgeText = '🔥 MAIS VENDIDO';
        badgeColor = '#EF4444'; // Red
      } else if (item.tag === 'parado') {
        badgeText = '🚀 PROMOÇÃO RELÂMPAGO';
        badgeColor = '#EC4899'; // Pink/Magenta
      } else if (item.tag === 'estoque_alto') {
        badgeText = '💎 OPORTUNIDADE DO DIA';
        badgeColor = '#3B82F6'; // Blue
      } else {
        badgeText = '🎁 OFERTA EXCLUSIVA';
        badgeColor = '#10B981'; // Emerald Green
      }

      ctx.font = '900 10px sans-serif';
      ctx.letterSpacing = '1px';
      const badgeTextWidth = ctx.measureText(badgeText).width;
      const badgeW = badgeTextWidth + 16;
      const badgeH = 22;
      const badgeY = y + 54;

      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(infoX, badgeY, badgeW, badgeH, 6);
      } else {
        ctx.rect(infoX, badgeY, badgeW, badgeH);
      }
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, infoX + (badgeW / 2), badgeY + 14);

      // 3. Prices Hierarchy
      const priceY = y + 105;
      ctx.textAlign = 'left';

      // Original price (Strike-through)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = 'bold 14px sans-serif';
      const origText = `de R$ ${item.originalPrice.toFixed(2)}`;
      ctx.fillText(origText, infoX, priceY);

      const origWidth = ctx.measureText(origText).width;
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(infoX, priceY - 5);
      ctx.lineTo(infoX + origWidth, priceY - 5);
      ctx.stroke();

      // Economy Highlight
      const savings = item.originalPrice - item.promoPrice;
      if (savings > 0) {
        const economyText = `ECONOMIZE R$ ${savings.toFixed(2)}`;
        ctx.font = '900 10px sans-serif';
        ctx.letterSpacing = '1px';
        const econW = ctx.measureText(economyText).width + 16;
        const econH = 20;
        const econY = y + 130;

        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(infoX, econY, econW, econH, 6);
        } else {
          ctx.rect(infoX, econY, econW, econH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10B981';
        ctx.textAlign = 'center';
        ctx.fillText(economyText, infoX + (econW / 2), econY + 13);
      }

      // 4. Promo Price Box on the Right (High Prominence)
      const boxX = cardX + 380;
      const boxY = y + 25;
      const boxW = 160;
      const boxH = 145;

      ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(boxX, boxY, boxW, boxH, 14);
      } else {
        ctx.rect(boxX, boxY, boxW, boxH);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '900 10px sans-serif';
      ctx.letterSpacing = '2px';
      ctx.textAlign = 'center';
      ctx.fillText('POR APENAS', boxX + (boxW / 2), boxY + 28);

      ctx.fillStyle = '#D4AF37';
      ctx.font = '900 28px sans-serif';
      ctx.fillText(`R$ ${item.promoPrice.toFixed(2)}`, boxX + (boxW / 2), boxY + 70);

      const ribbonText = 'DESCONTO ESPECIAL';
      ctx.font = '900 8px sans-serif';
      ctx.letterSpacing = '1px';
      const ribW = ctx.measureText(ribbonText).width + 12;
      const ribH = 16;
      const ribX = boxX + (boxW - ribW) / 2;
      const ribY = boxY + 86;

      ctx.fillStyle = '#D4AF37';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(ribX, ribY, ribW, ribH, 4);
      } else {
        ctx.rect(ribX, ribY, ribW, ribH);
      }
      ctx.fill();

      ctx.fillStyle = '#2D0B14';
      ctx.textAlign = 'center';
      ctx.fillText(ribbonText, boxX + (boxW / 2), ribY + 11);

      if (item.originalPrice > 0) {
        const discountPercent = Math.round(((item.originalPrice - item.promoPrice) / item.originalPrice) * 100);
        if (discountPercent > 0) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`-${discountPercent}% OFF`, boxX + (boxW / 2), boxY + 124);
        }
      }

      // 5. Stock Box on the Rightmost (Stock Urgency)
      const stockBoxX = cardX + 555;
      const stockBoxY = y + 25;
      const stockBoxW = 90;
      const stockBoxH = 145;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(stockBoxX, stockBoxY, stockBoxW, stockBoxH, 14);
      } else {
        ctx.rect(stockBoxX, stockBoxY, stockBoxW, stockBoxH);
      }
      ctx.fill();
      ctx.stroke();

      let stockEmoji = '📦';
      let line1Text = '';
      let line2Text = '';
      let textColor = 'rgba(255, 255, 255, 0.6)';

      if (item.stockQuantity === 1) {
        stockEmoji = '🔴';
        line1Text = 'ÚLTIMA';
        line2Text = 'UNIDADE';
        textColor = '#EF4444';
      } else if (item.stockQuantity === 2) {
        stockEmoji = '🟠';
        line1Text = 'RESTAM';
        line2Text = 'APENAS 2';
        textColor = '#F59E0B';
      } else if (item.stockQuantity > 2 && item.stockQuantity <= 5) {
        stockEmoji = '🟡';
        line1Text = 'ESTOQUE';
        line2Text = 'LIMITADO';
        textColor = '#EAB308';
      } else {
        stockEmoji = '📦';
        line1Text = `${item.stockQuantity}`;
        line2Text = 'DISPONÍVEIS';
        textColor = 'rgba(255, 255, 255, 0.7)';
      }

      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stockEmoji, stockBoxX + (stockBoxW / 2), stockBoxY + 45);

      ctx.fillStyle = textColor;
      ctx.font = '900 9px sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(line1Text, stockBoxX + (stockBoxW / 2), stockBoxY + 86);
      ctx.fillText(line2Text, stockBoxX + (stockBoxW / 2), stockBoxY + 102);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('EM ESTOQUE', stockBoxX + (stockBoxW / 2), stockBoxY + 124);
    });

    // Footer Block (3 differential columns)
    const footerY = 1135;
    const footerW = 660;
    const footerX = 70;
    const footerH = 65;

    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(footerX, footerY, footerW, footerH, 12);
    } else {
      ctx.rect(footerX, footerY, footerW, footerH);
    }
    ctx.fill();
    ctx.stroke();

    // Dividers
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(290, footerY + 10);
    ctx.lineTo(290, footerY + footerH - 10);
    ctx.moveTo(510, footerY + 10);
    ctx.lineTo(510, footerY + footerH - 10);
    ctx.stroke();

    // Column 1
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚚 PRONTA ENTREGA', 180, footerY + 28);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 9px sans-serif';
    ctx.fillText('Envio rápido para sua região', 180, footerY + 44);

    // Column 2
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('✨ ENVIO IMEDIATO', 400, footerY + 28);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 9px sans-serif';
    ctx.fillText('Produtos prontos para envio', 400, footerY + 44);

    // Column 3
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('📦 ESTOQUE REAL', 620, footerY + 28);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '500 9px sans-serif';
    ctx.fillText('Atualizado em tempo real', 620, footerY + 44);

    // Call to Action (CTA) Pill Button at the very bottom
    const ctaY = 1220;
    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(100, ctaY, 600, 46, 23);
    } else {
      ctx.rect(100, ctaY, 600, 46);
    }
    ctx.fill();

    // Circle decor inside CTA Button
    ctx.fillStyle = '#2D0B14';
    ctx.beginPath();
    ctx.arc(140, ctaY + 23, 15, 0, Math.PI * 2);
    ctx.fill();

    // Heart icon inside Circle
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', 140, ctaY + 23);

    // CTA Text
    ctx.fillStyle = '#2D0B14';
    ctx.font = '900 12px sans-serif';
    ctx.letterSpacing = '1px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('FAÇA SEU PEDIDO ENQUANTO AINDA HÁ DISPONIBILIDADE!', 415, ctaY + 27);

    // Save image preview data url
    setImagePreview(canvas.toDataURL('image/png'));
  };


  // Re-draw whenever suggestions change
  useEffect(() => {
    if (suggestions.length > 0) {
      // Small timeout to allow canvas element to be rendered in DOM before drawing
      const timer = setTimeout(() => {
        renderFlyer();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [suggestions]);

  // Download Handler
  const handleDownloadFlyer = () => {
    if (!imagePreview) return;
    const link = document.createElement('a');
    link.download = `FluxoBeauty_Ofertas_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = imagePreview;
    link.click();
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Sparkles className="text-[#800020] w-7 h-7 sm:w-8 sm:h-8 shrink-0" /> Vitrine Express
        </h2>
      </div>

      {!hasGenerated ? (
        /* Tela Inicial / Chamada de ação */
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-50 shadow-sm p-6 sm:p-12 text-center max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Zap className="text-[#800020] w-10 h-10 sm:w-12 sm:h-12 animate-pulse shrink-0" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-tight">O que é o Catálogo Relâmpago?</h3>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-md mx-auto">
              Não é apenas um catálogo estático. É um gerador de ofertas inteligente que analisa seu estoque físico e vendas para sugerir os melhores produtos do dia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Produtos Parados</p>
                <p className="text-[9px] font-medium text-slate-400 leading-tight">Prioriza o que não vende há mais de 20 dias para girar estoque.</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
              <span className="text-xl">📦</span>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Estoque Alto</p>
                <p className="text-[9px] font-medium text-slate-400 leading-tight">Sugere itens em excesso para "desovar" do armário central.</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Margem Excelente</p>
                <p className="text-[9px] font-medium text-slate-400 leading-tight">Seleciona produtos que dão lucro mesmo aplicando descontos.</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
              <span className="text-xl">✨</span>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Mais Procurados</p>
                <p className="text-[9px] font-medium text-slate-400 leading-tight">Destaca os mais vendidos do mês como novidade especial.</p>
              </div>
            </div>
          </div>

          <button
            onClick={generateSuggestions}
            className="bg-[#800020] text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest flex items-center justify-center gap-2 mx-auto shadow-xl shadow-red-900/25 hover:bg-[#600018] hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Zap size={16} className="shrink-0" /> Gerar Catálogo de Hoje
          </button>
        </div>
      ) : (
        /* Catalog suggestions listing and controls */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Catalog editor */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-50 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Sugestões Analisadas</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ajuste preços ou emojis se necessário</p>
                </div>
                <button
                  onClick={generateSuggestions}
                  className="p-3 text-slate-400 hover:text-[#800020] bg-slate-50 rounded-xl hover:bg-rose-50 transition-colors"
                  title="Recalcular Ofertas"
                >
                  <RefreshCw size={16} className="shrink-0" />
                </button>
              </div>

              {suggestions.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Info className="w-8 h-8 mx-auto mb-2 text-slate-300 shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum produto em estoque para recomendar.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {suggestions.map((item, idx) => {
                    const originalProd = products.find(p => p.id === item.productId);
                    const tagLabels: Record<string, string> = {
                      parado: 'Produto Parado ⏳',
                      estoque_alto: 'Estoque Elevado 📦',
                      margem_boa: 'Alta Margem 💰',
                      mais_vendido: 'Mais Vendido 🏆'
                    };

                    return (
                      <div key={item.productId} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex gap-3 items-center">
                            <input
                              type="text"
                              maxLength={2}
                              value={item.emoji}
                              onChange={e => handleUpdateEmoji(idx, e.target.value)}
                              className="w-12 h-12 text-center bg-white border border-slate-100 rounded-xl text-xl font-bold shadow-sm outline-none focus:border-[#800020]/20"
                            />
                            <div>
                              <p className="font-bold text-[11px] sm:text-xs text-slate-900 uppercase tracking-tight line-clamp-1">{item.productName}</p>
                              <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${
                                item.tag === 'parado' ? 'bg-red-50 text-red-600' :
                                item.tag === 'estoque_alto' ? 'bg-blue-50 text-blue-600' :
                                item.tag === 'margem_boa' ? 'bg-amber-50 text-amber-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                                {tagLabels[item.tag]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Preço Normal</span>
                            <span className="text-slate-800 font-bold text-xs">R$ {item.originalPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Preço Promo (R$)</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={promoPricesStr[item.productId] || ''}
                              onChange={e => handlePromoPriceInputChange(idx, item.productId, e.target.value)}
                              onBlur={() => handlePromoPriceBlur(idx, item.productId)}
                              className="w-full px-2 py-1 bg-white border border-slate-100 rounded-lg text-slate-950 font-black text-xs outline-none focus:border-[#800020]/30"
                            />
                          </div>
                          <div className="text-right">
                            <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Estoque Físico</span>
                            <span className="text-slate-800 font-bold text-xs uppercase">{item.stockQuantity} un</span>
                          </div>
                        </div>
                        <p className="text-[8px] font-medium text-slate-400 leading-tight uppercase tracking-wider">{item.reason}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* WhatsApp Text Block */}
            {suggestions.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-50 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#800020] shrink-0" /> Texto para WhatsApp
                  </h3>
                  <button
                    onClick={handleCopyText}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                      copied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-950 text-white hover:bg-black shadow-md shadow-slate-200'
                    }`}
                  >
                    {copied ? <Check size={12} className="shrink-0" /> : <Copy size={12} className="shrink-0" />}
                    {copied ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={whatsAppText}
                  className="w-full h-64 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-mono text-slate-800 outline-none resize-none custom-scrollbar"
                />
              </div>
            )}
          </div>

          {/* Right panel: Flyer view & canvas */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col items-center space-y-6">
              <div className="w-full flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                    <Flame size={16} className="text-[#D4AF37] shrink-0" /> Visual da Imagem (Flyer)
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gere a imagem para seus Stories ou WhatsApp</p>
                </div>
                <button
                  disabled={!imagePreview}
                  onClick={handleDownloadFlyer}
                  className="flex items-center gap-1.5 bg-[#800020] text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-[#600018] shadow-md shadow-red-900/10 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  <Download size={14} className="shrink-0" /> Salvar Imagem
                </button>
              </div>

              {/* Hidden rendering canvas */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* High definition visual image preview */}
              {imagePreview ? (
                <div className="relative group max-w-[340px] w-full mx-auto">
                  <img
                    src={imagePreview}
                    className="w-full rounded-3xl shadow-2xl border-4 border-white/60 group-hover:scale-[1.01] transition-transform duration-300"
                    alt="Catalogo Relampago"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center backdrop-blur-sm pointer-events-none">
                    <span className="bg-white text-slate-950 font-black uppercase text-[10px] tracking-widest px-4 py-2 rounded-xl shadow-lg">Toque e segure para salvar</span>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[320px] aspect-[800/1200] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8">
                  <LoaderIcon className="w-8 h-8 animate-spin text-[#800020] mb-2 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">Carregando panfleto digital...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple loader helper icon
const LoaderIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
