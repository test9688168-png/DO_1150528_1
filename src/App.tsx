import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Edit3, 
  Plus, 
  Minus, 
  Search, 
  Check, 
  RefreshCw, 
  X, 
  CircleUser, 
  Coffee, 
  Share2, 
  TrendingUp, 
  BadgeDollarSign, 
  ChevronRight, 
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// === 類型定義 Type Definitions ===
interface MenuItem {
  name: string;
  price: number;
  category: string;
  description: string;
}

interface Order {
  orderId: string;
  timestamp: string;
  name: string;
  drink: string;
  sugar: string;
  ice: string;
  quantity: number;
  totalPrice: number;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
}

const API_URL = "https://script.google.com/macros/s/AKfycbyBbQdws_D5-GHglUhmS32bYRUSwX5cg1m8pTCbopMoo3iBxHy7sNIuy-G0DLlVVGXRNA/exec";

// === 精選預設菜單 Fallback Menu ===
const FALLBACK_MENU: MenuItem[] = [
  { name: "手作蜂蜜白玉珍珠鮮奶茶", price: 65, category: "濃厚醇奶系列", description: "香濃斯里蘭卡紅茶融入小農鮮乳，Q彈蜂蜜冷泉白玉珍珠" },
  { name: "海鹽香緹焦糖芝芝四季春", price: 60, category: "金黃雪蓋系列", description: "極品南農四季春，覆蓋厚達3公分焦糖海鹽綿密滑順鹹甜芝士奶蓋" },
  { name: "頂級手工黑糖波霸牧場鮮奶", price: 70, category: "濃厚醇奶系列", description: "手炒焦香黑糖慢熟慢熬，搭上100%初鹿鮮乳不著一滴水與茶" },
  { name: "文山清香包種茶", price: 35, category: "經典在地純茶", description: "淡淡梔子花香，茶湯明亮金黃，入口生津爽口回甘" },
  { name: "極上阿里山金萱烏龍", price: 40, category: "經典在地純茶", description: "帶有甘美天然奶香與淡淡桂花幽香，層次豐富喉韻鮮甜" },
  { name: "黃金比例屏東翡翠冬瓜檸檬", price: 55, category: "沁涼鮮菓茶飲", description: "新鮮手榨九如綠檸檬，古法慢熬琥珀冬瓜與青茶，酸甜清涼" },
  { name: "紅寶石鮮橙百香鮮綠茶", price: 65, category: "沁涼鮮菓茶飲", description: "整顆新鮮香柳橙切片，佐以新鮮百香果粒，鮮甜爆汁" },
  { name: "皇家重乳炭焙鐵觀音拿鐵", price: 60, category: "濃厚醇奶系列", description: "炭火慢焙鐵觀音，茶感沉穩帶木質炭香，乳香超濃厚" },
  { name: "京都宇治御用抹茶拿鐵", price: 75, category: "濃厚醇奶系列", description: "日本一保堂等級抹茶粉現點現刷，細緻微苦與濃醇鮮奶完美調合" },
  { name: "莊園黃金熟成紅茶", price: 35, category: "經典在地純茶", description: "嚴選大吉嶺莊園紅茶極致陳化熟成，濃郁熟果麥芽香氣" },
  { name: "法式生巧克力燕麥歐蕾", price: 80, category: "無糖小農鮮奶", description: "頂級法式調溫巧克力，融入低敏燕麥奶，柔滑濃厚低負擔" }
];

const SUGAR_LEVELS = [
  { label: "按比例調配", value: "店家黃金比例", desc: "主廚推薦" },
  { label: "正常糖", value: "正常糖", desc: "10分糖" },
  { label: "少糖 (七分)", value: "七分糖", desc: "7分糖" },
  { label: "半糖 (五分)", value: "半糖", desc: "5分糖" },
  { label: "微糖 (三分)", value: "微糖", desc: "3分糖" },
  { label: "二分糖", value: "二分糖", desc: "2分糖" },
  { label: "無糖", value: "無糖", desc: "0分糖" }
];

const ICE_LEVELS = [
  { label: "正常冰", value: "正常冰", desc: "足量冰塊" },
  { label: "少冰", value: "少冰", desc: "7分冰" },
  { label: "微冰", value: "微冰", desc: "3分冰" },
  { label: "去冰", value: "去冰", desc: "僅調溫" },
  { label: "完全去冰", value: "完全去冰", desc: "完全無冰" },
  { label: "溫熱", value: "溫熱", desc: "冬日推薦" }
];

const RECENT_ORDERERS_KEY = "office_drink_recent_names";
const OFFLINE_ORDERS_KEY = "office_drink_offline_orders_today";

export default function App() {
  const [menu, setMenu] = useState<MenuItem[]>(FALLBACK_MENU);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // 搜尋與篩選狀態
  const [drinkSearch, setDrinkSearch] = useState<string>("");
  const [menuFilter, setMenuFilter] = useState<string>("全部");
  const [ordersSearch, setOrdersSearch] = useState<string>("");

  // 填單/修改狀態
  const [formData, setFormData] = useState({
    orderId: "", // 修改時填入，新建時留空
    name: "",
    drink: FALLBACK_MENU[0].name,
    sugar: "半糖",
    ice: "少冰",
    quantity: 1,
    unitPrice: FALLBACK_MENU[0].price,
    totalPrice: FALLBACK_MENU[0].price
  });

  const [recentNames, setRecentNames] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  // 載入初始資料
  useEffect(() => {
    fetchData();
    // 載入最近訂購人
    try {
      const saved = localStorage.getItem(RECENT_ORDERERS_KEY);
      if (saved) {
        setRecentNames(JSON.parse(saved));
      } else {
        const defaultNames = ["陳小明", "林美美", "張經理", "王助理", "李工程師"];
        setRecentNames(defaultNames);
        localStorage.setItem(RECENT_ORDERERS_KEY, JSON.stringify(defaultNames));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 更新總價
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalPrice: prev.unitPrice * prev.quantity
    }));
  }, [formData.unitPrice, formData.quantity]);

  // 顯示 Toast 訊息
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' | 'loading', duration = 3500) => {
    setToast({ message, type });
    if (type !== 'loading') {
      setTimeout(() => {
        setToast(prev => (prev && prev.message === message ? null : prev));
      }, duration);
    }
  };

  // GET 請求拉取資料
  const fetchData = async () => {
    setLoading(true);
    triggerToast("正在與辦公室後端雲端同步...", "loading");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超時

      const response = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("API 響應錯誤 " + response.status);
      const res = await response.json();

      if (res.menu && res.menu.length > 0) {
        setMenu(res.menu);
      } else {
        setMenu(FALLBACK_MENU);
      }

      setOrders(res.orders || []);
      setIsOffline(false);
      triggerToast("雲端同步成功！", "success");
    } catch (error: any) {
      console.warn("無法連接 Google Sheets 後端，正在切換至本地單機運作模式...", error);
      setIsOffline(true);
      // 從 localStorage 撈取今日訂單
      const localOrders = localStorage.getItem(OFFLINE_ORDERS_KEY);
      if (localOrders) {
        setOrders(JSON.parse(localOrders));
      } else {
        setOrders([]);
      }
      setMenu(FALLBACK_MENU); // 使用本地豐富菜單
      triggerToast("已自動切換至「本機單機展示模式」(所有操作儲存於本機)", "info", 5000);
    } finally {
      setLoading(false);
    }
  };

  // 新增/修改/刪除的 POST 請求
  const handlePostAction = async (action: 'create' | 'update' | 'delete', data: any) => {
    setSubmitting(true);
    triggerToast(`正在處理點單請求 (${action === 'create' ? '加入' : action === 'update' ? '更新' : '刪除'})...`, "loading");

    if (isOffline) {
      // 離線模擬處理
      setTimeout(() => {
        let updatedOrders = [...orders];
        if (action === 'create') {
          const newOrder: Order = {
            orderId: "local-" + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
            name: data.name || "無名氏",
            drink: data.drink,
            sugar: data.sugar,
            ice: data.ice,
            quantity: data.quantity,
            totalPrice: data.totalPrice
          };
          updatedOrders.push(newOrder);
          saveRecentName(newOrder.name);
          resetForm();
        } else if (action === 'update') {
          updatedOrders = updatedOrders.map(o => 
            o.orderId === data.orderId 
              ? { ...o, name: data.name, drink: data.drink, sugar: data.sugar, ice: data.ice, quantity: data.quantity, totalPrice: data.totalPrice }
              : o
          );
          saveRecentName(data.name);
          resetForm();
        } else if (action === 'delete') {
          updatedOrders = updatedOrders.filter(o => o.orderId !== data.orderId);
        }

        setOrders(updatedOrders);
        localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(updatedOrders));
        setSubmitting(false);
        triggerToast(`${action === 'create' ? '點單成功！' : action === 'update' ? '點單修改成功！' : '點單已成功取消！'}`, "success");
      }, 600);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({ action, data })
      });

      const res = await response.json();
      if (res.status === "success") {
        if (action === 'create' || action === 'update') {
          saveRecentName(data.name);
          resetForm();
        }
        triggerToast(res.message || "操作已成功同步到 Google Sheet！", "success");
        // 即時刷新資料以獲得最新資訊
        await reloadOrdersOnly();
      } else {
        throw new Error(res.message || "後端返回失敗");
      }
    } catch (error: any) {
      console.error(error);
      triggerToast("雲端寫入發生異常，已為您保存在本地！", "error");
      
      // 當雲端提交失敗時，緊急儲備到本地 localStorage
      setIsOffline(true);
      let updatedOrders = [...orders];
      if (action === 'create') {
        const fallbackOrder: Order = {
          orderId: "err-" + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
          name: data.name || "本地緊急",
          drink: data.drink,
          sugar: data.sugar,
          ice: data.ice,
          quantity: data.quantity,
          totalPrice: data.totalPrice
        };
        updatedOrders.push(fallbackOrder);
        setOrders(updatedOrders);
        resetForm();
      }
      localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(updatedOrders));
    } finally {
      setSubmitting(false);
    }
  };

  // 僅重新獲取訂單（加快刷新速度，免去選單刷新）
  const reloadOrdersOnly = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const res = await response.json();
        setOrders(res.orders || []);
      }
    } catch (apiErr) {
      console.warn("Refresh failed", apiErr);
    }
  };

  // 儲存最近訂購人姓名至 localStorage
  const saveRecentName = (name: string) => {
    if (!name || name.trim() === "") return;
    const cleanName = name.trim();
    setRecentNames(prev => {
      const filtered = prev.filter(n => n !== cleanName);
      const newNames = [cleanName, ...filtered].slice(0, 8); // 最多記錄 8 個
      localStorage.setItem(RECENT_ORDERERS_KEY, JSON.stringify(newNames));
      return newNames;
    });
  };

  // 重設表單
  const resetForm = () => {
    const firstDrink = menu && menu.length > 0 ? menu[0] : FALLBACK_MENU[0];
    setFormData({
      orderId: "",
      name: "",
      drink: firstDrink.name,
      sugar: "半糖",
      ice: "少冰",
      quantity: 1,
      unitPrice: firstDrink.price,
      totalPrice: firstDrink.price
    });
  };

  // 點擊飲料修改選中的飲料與單價
  const handleSelectDrink = (drinkName: string, price: number) => {
    setFormData(prev => ({
      ...prev,
      drink: drinkName,
      unitPrice: price,
      totalPrice: price * prev.quantity
    }));
    // 捲動至填單區
    const element = document.getElementById("order-form-container");
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 編輯訂單
  const handleEditClick = (order: Order) => {
    const matchedDrink = menu.find(m => m.name === order.drink) || FALLBACK_MENU.find(m => m.name === order.drink);
    const price = matchedDrink ? matchedDrink.price : (order.totalPrice / order.quantity);

    setFormData({
      orderId: order.orderId,
      name: order.name,
      drink: order.drink,
      sugar: order.sugar,
      ice: order.ice,
      quantity: order.quantity,
      unitPrice: price,
      totalPrice: order.totalPrice
    });

    const element = document.getElementById("order-form-container");
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    triggerToast(`正在編輯 ${order.name} 的點單`, "info", 2000);
  };

  // 送出表單
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.name.trim() === "") {
      triggerToast("請輸入訂購人姓名！", "error");
      return;
    }
    if (!formData.drink) {
      triggerToast("請選擇想喝的飲料！", "error");
      return;
    }

    const payload = {
      orderId: formData.orderId || undefined,
      name: formData.name.trim(),
      drink: formData.drink,
      sugar: formData.sugar,
      ice: formData.ice,
      quantity: formData.quantity,
      totalPrice: formData.totalPrice
    };

    if (formData.orderId) {
      handlePostAction('update', payload);
    } else {
      handlePostAction('create', payload);
    }
  };

  // 刪除名字
  const handleDeleteRecentName = (nameToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentNames.filter(n => n !== nameToDelete);
    setRecentNames(updated);
    localStorage.setItem(RECENT_ORDERERS_KEY, JSON.stringify(updated));
  };

  // 當日飲品菜單篩選
  const categories = ["全部", ...Array.from(new Set(menu.map(item => item.category)))];
  const filteredMenu = menu.filter(item => {
    const matchesCategory = menuFilter === "全部" || item.category === menuFilter;
    const matchesSearch = item.name.toLowerCase().includes(drinkSearch.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(drinkSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 訂單搜尋篩選
  const filteredOrders = orders.filter(order => {
    const term = ordersSearch.toLowerCase();
    return order.name.toLowerCase().includes(term) || order.drink.toLowerCase().includes(term) || order.sugar.toLowerCase().includes(term) || order.ice.toLowerCase().includes(term);
  });

  // 統計數值
  const totalCups = orders.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalAmount = orders.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const distinctDrinkCount = new Set(orders.map(o => o.drink)).size;

  // 抓取今日最旺飲品
  const drinkStats: { [key: string]: number } = {};
  orders.forEach(o => {
    drinkStats[o.drink] = (drinkStats[o.drink] || 0) + o.quantity;
  });
  let mostPopularDrink = "尚無訂購";
  let mostPopularCount = 0;
  Object.keys(drinkStats).forEach(key => {
    if (drinkStats[key] > mostPopularCount) {
      mostPopularCount = drinkStats[key];
      mostPopularDrink = key;
    }
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] font-sans antialiased pb-16">
      
      {/* === 頂端橫幅 Toast 系統 === */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] transition-transform duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl ${
            toast.type === 'success' ? 'bg-[#1e293b]/95 border-emerald-500/20 text-emerald-300' :
            toast.type === 'error' ? 'bg-[#1e293b]/95 border-rose-500/20 text-rose-300' :
            toast.type === 'loading' ? 'bg-[#1e293b]/95 border-sky-500/20 text-sky-300 animate-pulse' :
            'bg-[#1e293b]/95 border-indigo-500/20 text-indigo-300'
          }`}>
            {toast.type === 'loading' ? (
              <RefreshCw className="h-5 w-5 animate-spin text-sky-400" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            ) : (
              <Info className="h-5 w-5 text-indigo-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium flex-1 leading-relaxed">{toast.message}</span>
            {toast.type !== 'loading' && (
              <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-white/10 text-slate-300">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* === 大氣漸層精緻標題列 (Header Header) === */}
      <header className="relative overflow-hidden bg-slate-900/50 border-b border-slate-800 text-slate-100 py-8 px-6 sm:px-10 lg:px-16 mb-8">
        
        {/* 背景光暈 */}
        <div className="absolute top-0 right-0 p-10 translate-x-1/4 -translate-y-1/4 bg-sky-500/5 rounded-full w-96 h-96 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 bg-indigo-500/5 rounded-full w-80 h-80 blur-2xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          
          {/* 左側名稱 */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex bg-sky-500/10 text-sky-400 p-2.5 rounded-2xl border border-sky-500/20 shadow-inner font-bold transform hover:rotate-6 transition-transform">
                <Coffee className="h-6 w-6" id="boba-logo-icon" />
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-widest uppercase text-sky-400 font-extrabold bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">Daily Drink Hub</span>
                  {isOffline ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      單機演示模式
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      雲端同步中
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400 tracking-tight mt-0.5">辦公室飲料點單系統</h1>
              </div>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm font-light">
              2026 活力午茶大集結 🧋 輕鬆點單、一鍵統計，今天想喝點什麼呢？
            </p>
          </div>

          {/* 右側按鈕 */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-850 hover:bg-slate-800 active:bg-slate-750 disabled:opacity-50 text-sky-400 rounded-xl text-sm font-medium transition-all duration-250 border border-slate-700/60"
              id="refresh-btn"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              重新整理
            </button>
            <div className="text-xs text-slate-400 font-mono bg-slate-950/40 px-3.5 py-2.5 rounded-xl border border-slate-800/80">
              <span className="text-indigo-400 font-semibold">今日工作表：</span> 
              {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}
            </div>
          </div>

        </div>

        {/* 統計面板 */}
        <div className="max-w-7xl mx-auto mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 border-t border-slate-800/80 pt-6">
          <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/50 backdrop-blur-sm flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">今日總杯數</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-100">{totalCups} <span className="text-xs font-normal text-slate-400">杯</span></p>
            </div>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/50 backdrop-blur-sm flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <BadgeDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">當前統計總額</p>
              <p className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">{totalAmount} <span className="text-xs font-normal text-slate-400">元</span></p>
            </div>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/50 backdrop-blur-sm flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">已點飲品種類</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-100">{distinctDrinkCount} <span className="text-xs font-normal text-slate-400">種</span></p>
            </div>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/50 backdrop-blur-sm flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-medium">最旺人氣款</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400 truncate" title={mostPopularDrink}>
                {mostPopularDrink}
              </p>
              {mostPopularCount > 0 && <p className="text-xs text-slate-400">共 {mostPopularCount} 杯</p>}
            </div>
          </div>
        </div>

      </header>

      {/* === 主要布局 Container === */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* API 連線提示訊息 */}
        {isOffline && (
          <div className="mb-6 bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 text-slate-300 text-sm flex items-start gap-3 shadow-md backdrop-blur-md">
            <Info className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <span className="font-extrabold text-amber-400">系統連線提示：</span>
              <p className="text-slate-300 leading-relaxed font-light">
                因無法連通 Google Sheet API（或為本地預覽模式），系統已自動啟用<span className="font-semibold underline text-sky-400">本機快取離線執行機制</span>。您在此頁面填寫的所有點單將 100% 儲存在您的瀏覽器暫存 (LocalStorage) 中，功能及流暢度絲毫不打折！
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* === 左側欄：填單 OrderForm 元件 (Span 5) === */}
          <section className="lg:col-span-5 space-y-6">
            
            <div 
              id="order-form-container"
              className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative"
            >
              {/* 修改模式標記 */}
              {formData.orderId && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 bg-indigo-500 text-slate-950 text-xs px-4 py-1.5 rounded-full font-extrabold shadow-md animate-bounce shadow-indigo-500/20">
                  <Edit3 className="h-3 w-3" />
                  正處於點單編輯狀態
                </div>
              )}

              <h2 className="text-xl font-bold tracking-tight pb-4 border-b border-slate-800/80 flex items-center gap-2 mb-6">
                <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                  <Coffee className="h-5 w-5" />
                </span>
                {formData.orderId ? "修改我的今日點單" : "填寫今日新點單"}
              </h2>

              <form onSubmit={handleSubmitForm} className="space-y-6">
                
                {/* 1. 訂購人姓名與最近名字快速點擊 */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300 flex justify-between items-center">
                    <span>1. 誰要喝的？ (訂購人姓名) <span className="text-rose-400">*</span></span>
                    <span className="text-xs font-normal text-slate-400">請輸入真實姓名以利認領</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：王小明"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700/80 text-slate-100 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all text-sm font-medium placeholder-slate-500"
                    id="orderer-input"
                  />

                  {/* 最近訂購人快速點擊面板 */}
                  {recentNames.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-400 mb-2 font-medium">常見訂購人快速填入：</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recentNames.map((name, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, name }))}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700/65"
                          >
                            <CircleUser className="h-3 w-3 opacity-75 text-sky-400" />
                            {name}
                            <span 
                              onClick={(e) => handleDeleteRecentName(name, e)}
                              className="ml-1 hover:text-rose-400 p-0.5 rounded-full hover:bg-white/5"
                              title="移除常用姓名"
                            >
                              <X className="h-3 w-3" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. 已選定的飲品顯示 */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-300 flex justify-between items-center">
                    <span>2. 已選飲料種類</span>
                    <span className="text-xs text-sky-400 font-medium bg-sky-950/40 border border-sky-900/30 px-2 py-0.5 rounded-full">
                      單價: ${formData.unitPrice}元
                    </span>
                  </label>
                  <div className="p-4 rounded-2xl bg-slate-850/60 border border-slate-800/80 flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-100 text-md">{formData.drink}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-light">
                        {menu.find(m => m.name === formData.drink)?.description || "清爽消暑，辦公室最愛特調！"}
                      </p>
                    </div>
                    <span className="text-slate-500 font-mono text-xs select-none pl-3 self-center whitespace-nowrap">已點選</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-light">
                    💡 您可以點擊右側的「飲品選單卡片」直接替換本欄飲料。
                  </p>
                </div>

                {/* 3. 甜度調整 (正常糖、七分、半糖、微糖、無糖) */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-slate-300">
                    3. 甜度（多段客製甜度調整）
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {SUGAR_LEVELS.map((sugarLevel, idx) => {
                      const isSelected = formData.sugar === sugarLevel.value;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, sugar: sugarLevel.value }))}
                          className={`p-2.5 rounded-xl text-center border transition-all duration-150 flex flex-col justify-center items-center ${
                            isSelected 
                              ? 'bg-gradient-to-r from-sky-400 to-indigo-400 border-transparent text-slate-950 shadow-md transform scale-[1.03] font-bold shadow-sky-500/10' 
                              : 'bg-slate-850 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="text-xs">{sugarLevel.value}</span>
                          <span className={`text-[10px] mt-0.5 font-light ${isSelected ? 'text-indigo-950' : 'text-slate-500'}`}>
                            {sugarLevel.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. 冰塊調整 (正常冰、少冰、微冰、去冰、溫熱) */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-slate-300">
                    4. 溫度與冰量調整
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ICE_LEVELS.map((iceLevel, idx) => {
                      const isSelected = formData.ice === iceLevel.value;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, ice: iceLevel.value }))}
                          className={`p-2.5 rounded-xl text-center border transition-all duration-150 flex flex-col justify-center items-center ${
                            isSelected 
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-400 border-transparent text-slate-950 shadow-sm transform scale-[1.03] font-bold' 
                              : 'bg-slate-850 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="text-xs">{iceLevel.value}</span>
                          <span className={`text-[10px] mt-0.5 font-light ${isSelected ? 'text-teal-950' : 'text-slate-500'}`}>
                            {iceLevel.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. 數量加減與總體金額 */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-row items-center justify-between gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      5. 點購數量
                    </label>
                    <div className="inline-flex items-center border border-slate-800 rounded-xl bg-slate-850 p-1">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                        className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-sky-400 active:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-12 text-center font-extrabold focus:outline-none bg-transparent text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                        className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-sky-400 active:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex-1">
                    <p className="text-xs text-slate-500 font-medium">目前的結算金額</p>
                    <p className="text-3xl font-bold text-sky-400 mt-1">
                      ${formData.totalPrice} <span className="text-xs font-normal text-slate-400">元</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-light mt-0.5">
                      (${formData.unitPrice} 元 × {formData.quantity} 杯)
                    </p>
                  </div>
                </div>

                {/* 送出或取消按鈕群組 */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-4 rounded-xl font-bold text-md text-slate-950 shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${
                      formData.orderId 
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-emerald-500/10' 
                        : 'bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 shadow-sky-500/15'
                    }`}
                  >
                    {submitting ? (
                      <RefreshCw className="h-5 w-5 animate-spin text-slate-950" />
                    ) : formData.orderId ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                    {formData.orderId ? "確定更新與保存修改" : "確認訂購！加入今日統計"}
                  </button>

                  {formData.orderId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <X className="h-4 w-4" />
                      取消修改模式 (復原全新點單)
                    </button>
                  )}
                </div>

              </form>
            </div>

            {/* 一些使用小技巧提示 */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 text-xs text-slate-300 space-y-2.5">
              <h4 className="font-extrabold flex items-center gap-1.5 text-sky-450">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                辦公室點單小幫手貼心提醒：
              </h4>
              <ul className="list-disc list-inside space-y-1 bg-transparent text-slate-400 font-light pl-1">
                <li><span className="font-semibold text-slate-300">雙向修改功能：</span> 在右側名單若發現填錯，點擊 「編輯」 即可拉回此表單直接覆寫或增減數量。</li>
                <li><span className="font-semibold text-slate-300">多杯一併登記：</span> 如果同一種口味替大家購買，利用「數量+鈕」一併登記以縮短工作表行數。</li>
                <li><span className="font-semibold text-slate-300">離線儲存安全：</span> 即便利線狀態或後端被阻擋，您的資料依然會 100% 儲存在您的瀏覽器中不曾流失。</li>
              </ul>
            </div>

          </section>

          {/* === 右側欄：飲料菜單與當日點單列表 (Span 7) === */}
          <section className="lg:col-span-7 space-y-8">
            
            {/* 1. 飲品菜單卡片區，提供點擊 */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800 shadow-xl">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <span className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                      <Sliders className="h-4 w-4" />
                    </span>
                    精選飲品推薦菜單
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">點擊菜單卡片，即可自動將其帶入左側點單表單</p>
                </div>

                {/* 搜尋欄 */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={drinkSearch}
                    onChange={(e) => setDrinkSearch(e.target.value)}
                    placeholder="搜尋大吉嶺、鮮奶..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700/80 outline-none focus:border-sky-400 text-slate-100 placeholder-slate-500 transition-colors"
                  />
                  {drinkSearch && (
                    <button onClick={() => setDrinkSearch("")} className="absolute right-3 top-2.5 hover:text-rose-450">
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* 類別篩選滑動區 */}
              <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-thin select-none">
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMenuFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                      menuFilter === cat 
                        ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-500/10' 
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 卡片網格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredMenu.length > 0 ? (
                  filteredMenu.map((item, idx) => {
                    const isCurrentlySelected = formData.drink === item.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectDrink(item.name, item.price)}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                          isCurrentlySelected 
                            ? 'bg-sky-500/10 border-sky-500/40 shadow-inner' 
                            : 'bg-slate-900/35 border-slate-800/80 hover:border-sky-500/30 hover:bg-slate-850/40 text-slate-350'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h4 className="font-semibold text-xs text-slate-200 leading-tight flex-1 break-words">
                            {item.name}
                          </h4>
                          <span className="text-xs font-bold text-sky-400 flex-shrink-0 bg-sky-950/45 border border-sky-900/30 rounded-md px-2 py-0.5 font-mono">
                            ${item.price}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-450 line-clamp-2 leading-relaxed font-light mb-2">
                          {item.description || "選用上等茶葉現萃特調，極致甘美。"}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/40">
                            {item.category}
                          </span>
                          {isCurrentlySelected && (
                            <span className="text-[10px] text-sky-400 font-extrabold flex items-center gap-0.5">
                              <CheckCircle2 className="h-3.5 w-3.5" /> 選定中
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-10">
                    <p className="text-sm text-slate-500 font-light">找不到符合篩選條件的飲品 🔍</p>
                  </div>
                )}
              </div>

            </div>

            {/* 2. 當日訂單列表區 OrderList 元件 */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800 shadow-xl">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                    今日點單實時名冊
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">目前已成功連線回傳今日的所有點單</p>
                </div>

                {/* 搜尋與篩選訂單 */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="搜尋訂購人、飲料..."
                    className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-800 border border-slate-700/80 outline-none focus:border-indigo-400 text-slate-100 placeholder-slate-500 transition-colors"
                  />
                  {ordersSearch && (
                    <button onClick={() => setOrdersSearch("")} className="absolute right-3 top-2.5 hover:text-rose-450">
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* 訂單卡片列表 */}
              <div className="space-y-3.5">
                {orders.length === 0 ? (
                  // === 目前無人訂購的引導畫面 ===
                  <div className="text-center py-16 px-4 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                    <div className="relative inline-flex items-center justify-center p-6 bg-sky-500/5 rounded-full mb-4 animate-bounce">
                      <Coffee className="h-10 w-10 text-sky-400" />
                      <Plus className="absolute top-1 right-1 h-5 w-5 bg-sky-400 text-slate-950 rounded-full p-0.5 border-2 border-[#0f172a] font-black" />
                    </div>
                    <h4 className="text-md font-bold text-slate-200 mb-1.5">🍹 哇！目前尚未出現今天的第一筆點單</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed font-light mb-5">
                      不要害羞！在左側輸入您尊貴的姓名、選好清涼飲品與客製甜度冰塊，加入統計，呼朋引伴點起來吧！
                    </p>
                    <button
                      onClick={() => {
                        const inputElement = document.getElementById("orderer-input");
                        if (inputElement) {
                          inputElement.focus();
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-sky-400 to-indigo-400 hover:brightness-110 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/10"
                    >
                      我是第一個、立刻點餐！
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order, idx) => {
                    const isEditingThis = formData.orderId === order.orderId;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all duration-200 ${
                          isEditingThis 
                            ? 'bg-indigo-950/25 border-indigo-500/60 shadow-md ring-2 ring-indigo-500/10' 
                            : 'bg-slate-900/35 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/20'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          {/* 訂購人縮寫頭像 */}
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center uppercase shadow-md flex-shrink-0 select-none">
                            {order.name ? order.name.slice(0, 2) : "無"}
                          </div>

                          {/* 訂單完整資訊 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              <span className="font-bold text-sm text-slate-100 break-words">{order.name}</span>
                              <span className="text-[10px] text-slate-550 font-mono">
                                {order.timestamp ? order.timestamp.slice(0, 5) : "--:--"}
                              </span>
                            </div>

                            {/* 飲料客製簡介 */}
                            <p className="text-xs font-bold text-sky-300 mt-1 break-words flex items-center gap-1.5 flex-wrap">
                              {order.drink}
                              <span className="text-rose-400 font-extrabold bg-rose-950/10 px-1.5 py-0.5 rounded border border-rose-900/10 text-[10px]">×{order.quantity} 杯</span>
                            </p>

                            {/* 甜度/冰塊客製標籤群 */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="inline-flex text-[10px] font-semibold bg-slate-800 text-slate-350 px-2 py-0.5 rounded-lg border border-slate-700/60">
                                {order.sugar}
                              </span>
                              <span className="inline-flex text-[10px] font-semibold bg-slate-800 text-emerald-450 px-2 py-0.5 rounded-lg border border-slate-705/40">
                                {order.ice}
                              </span>
                            </div>
                          </div>

                          {/* 價格與編修防誤操作按鈕 */}
                          <div className="text-right flex flex-col justify-between h-full self-stretch min-w-[100px]">
                            <p className="text-lg font-bold text-slate-100 font-mono">${order.totalPrice}</p>
                            
                            <div className="flex items-center justify-end gap-1.5 mt-4">
                              <button
                                onClick={() => handleEditClick(order)}
                                className={`p-1.5 rounded-lg transition-colors border ${
                                  isEditingThis 
                                    ? 'bg-indigo-500 border-indigo-505 text-slate-950 hover:bg-indigo-400' 
                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-350 hover:text-sky-400'
                                }`}
                                title="編輯此筆訂單"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (confirm(`確定要刪除「${order.name}」所點的「${order.drink}」嗎？`)) {
                                    handlePostAction('delete', { orderId: order.orderId });
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-rose-900 text-slate-400 hover:text-rose-450 transition-colors"
                                title="刪除本筆點單"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 px-4 bg-slate-900/10 rounded-2xl border border-slate-800/80">
                    <p className="text-xs text-sky-400 font-semibold mb-1">找不到符合篩選條件的訂單 🔍</p>
                    <p className="text-[11px] text-slate-500 font-light">請更換頂端的搜尋內容</p>
                  </div>
                )}
              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}
