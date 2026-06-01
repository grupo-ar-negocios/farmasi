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
    setHasGenerated(true);
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
    let text = `✨ *OFERTAS DE HOJE* ✨\n\n`;

    suggestions.forEach(item => {
      const hasDiscount = item.promoPrice < item.originalPrice;
      const priceText = hasDiscount
        ? `de ~R$ ${item.originalPrice.toFixed(2)}~ por *R$ ${item.promoPrice.toFixed(2)}*`
        : `*R$ ${item.originalPrice.toFixed(2)}*`;

      let label = '';
      if (item.tag === 'parado') label = '🔥 _Giro de Estoque!_';
      else if (item.tag === 'estoque_alto') label = '⚡ _Promoção Especial_';
      else if (item.tag === 'margem_boa') label = '🎁 _Oferta Imperdível!_';
      else label = '✨ _Novidade Quente!_';

      const stockText = item.stockQuantity === 1 ? 'Última unidade!' : `${item.stockQuantity} un disponíveis`;

      text += `${item.emoji} *${item.productName}*\n`;
      text += `💰 ${priceText}\n`;
      text += `🏷️ ${label} • 📦 ${stockText}\n\n`;
      text += `━━━━━━━━━━\n\n`;
    });

    text += `🚚 *Pronta entrega para toda a região!*\n`;
    text += `💖 *Garanta o seu! Me chama no WhatsApp!*`;
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

    // Canvas size
    canvas.width = 800;
    canvas.height = 1200;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#3A000D'); // Dark Wine
    grad.addColorStop(0.5, '#5C0016'); // Wine
    grad.addColorStop(1, '#1A0006'); // Deep dark
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative Gold border
    ctx.strokeStyle = '#D4AF37'; // Gold
    ctx.lineWidth = 6;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

    // Inner thin border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
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
    ctx.font = '900 42px sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('OFERTAS DE HOJE', canvas.width / 2, 145);

    // Subtitle Date
    const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 14px sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(todayStr, canvas.width / 2, 185);

    // Divider Line
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 220);
    ctx.lineTo(canvas.width - 100, 220);
    ctx.stroke();

    // Render items
    let startY = 270;
    const itemHeight = 185;

    suggestions.forEach((item, idx) => {
      const y = startY + idx * itemHeight;

      // Draw item card background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(80, y, canvas.width - 160, itemHeight - 20);

      // Card border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.strokeRect(80, y, canvas.width - 160, itemHeight - 20);

      // Emoji (using default font that supports emojis)
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.emoji, 115, y + 78);

      // Product Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      
      // Truncate name if it's too long
      let nameToDraw = item.productName.toUpperCase();
      if (ctx.measureText(nameToDraw).width > 420) {
        nameToDraw = nameToDraw.slice(0, 25) + '...';
      }
      ctx.fillText(nameToDraw, 185, y + 55);

      // Tag Label
      let badgeText = '';
      let badgeColor = '#D4AF37'; // Gold default
      if (item.tag === 'parado') {
        badgeText = '🔥 QUEIMA DE ESTOQUE';
        badgeColor = '#ef4444'; // Red
      } else if (item.tag === 'estoque_alto') {
        badgeText = '⚡ SUPER DESCONTO';
        badgeColor = '#3b82f6'; // Blue
      } else if (item.tag === 'margem_boa') {
        badgeText = '🎁 OFERTA DO DIA';
        badgeColor = '#f59e0b'; // Amber
      } else {
        badgeText = '✨ MAIS PROCURADO';
        badgeColor = '#10b981'; // Emerald
      }

      ctx.fillStyle = badgeColor;
      ctx.font = '900 11px sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(badgeText, 185, y + 84);

      // Prices
      const hasDiscount = item.promoPrice < item.originalPrice;

      if (hasDiscount) {
        // Original price
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '500 18px sans-serif';
        const origText = `de R$ ${item.originalPrice.toFixed(2)}`;
        ctx.fillText(origText, 185, y + 125);

        // Strike through original price
        const origWidth = ctx.measureText(origText).width;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red strike
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(185, y + 119);
        ctx.lineTo(185 + origWidth, y + 119);
        ctx.stroke();

        // Promo Price
        ctx.fillStyle = '#D4AF37'; // Gold
        ctx.font = '900 28px sans-serif';
        ctx.fillText(`por R$ ${item.promoPrice.toFixed(2)}`, 185 + origWidth + 15, y + 127);
      } else {
        ctx.fillStyle = '#D4AF37'; // Gold
        ctx.font = '900 28px sans-serif';
        ctx.fillText(`R$ ${item.originalPrice.toFixed(2)}`, 185, y + 127);
      }

      // Stock Info (Align Right)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      const stockText = item.stockQuantity === 1 ? 'ÚLTIMA UNIDADE' : `${item.stockQuantity} DISPONÍVEIS`;
      ctx.fillText(stockText, canvas.width - 110, y + 122);
    });

    // Footer Block
    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.fillRect(80, 1030, canvas.width - 160, 90);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(80, 1030, canvas.width - 160, 90);

    ctx.fillStyle = '#D4AF37';
    ctx.font = '900 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText('🚚 PRONTA ENTREGA EM TODA A REGIÃO', canvas.width / 2, 1067);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('💬 ENVIE UMA MENSAGEM NO WHATSAPP E GARANTA O SEU!', canvas.width / 2, 1100);

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
          <Sparkles className="text-[#800020] w-7 h-7 sm:w-8 sm:h-8" /> Vitrine Express
        </h2>
      </div>

      {!hasGenerated ? (
        /* Tela Inicial / Chamada de ação */
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-50 shadow-sm p-6 sm:p-12 text-center max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Zap className="text-[#800020] w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
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
            <Zap size={16} /> Gerar Catálogo de Hoje
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
                  <RefreshCw size={16} />
                </button>
              </div>

              {suggestions.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
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
                              type="number"
                              step="0.01"
                              value={item.promoPrice}
                              onChange={e => handleUpdatePrice(idx, Number(e.target.value))}
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
                    <MessageSquare size={16} className="text-[#800020]" /> Texto para WhatsApp
                  </h3>
                  <button
                    onClick={handleCopyText}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                      copied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-950 text-white hover:bg-black shadow-md shadow-slate-200'
                    }`}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
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
                    <Flame size={16} className="text-[#D4AF37]" /> Visual da Imagem (Flyer)
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gere a imagem para seus Stories ou WhatsApp</p>
                </div>
                <button
                  disabled={!imagePreview}
                  onClick={handleDownloadFlyer}
                  className="flex items-center gap-1.5 bg-[#800020] text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-[#600018] shadow-md shadow-red-900/10 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  <Download size={14} /> Salvar Imagem
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
                  <LoaderIcon className="w-8 h-8 animate-spin text-[#800020] mb-2" />
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
