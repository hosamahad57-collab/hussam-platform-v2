import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@metagptx/web-sdk';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  Package,
  DollarSign,
  ArrowRightLeft,
  Check,
  Store,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const client = createClient();

type Currency = 'USD' | 'YER_SANAA' | 'YER_ADEN' | 'SAR';

interface Product {
  id: number;
  name: string;
  description: string;
  price_usd: number;
  price_display: number;
  stock: number;
  category: string;
  vendor_name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const CURRENCY_META: Record<Currency, { symbol: string; label: string }> = {
  USD: { symbol: '$', label: 'USD' },
  YER_SANAA: { symbol: '﷼', label: "YER (Sana'a)" },
  YER_ADEN: { symbol: '﷼', label: 'YER (Aden)' },
  SAR: { symbol: '﷼', label: 'SAR' },
};

export default function Marketplace() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(1);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/marketplace/catalog',
        method: 'POST',
        data: {
          category: selectedCategory === 'All' ? null : selectedCategory,
          search: searchQuery || null,
          currency,
        },
      });
      setProducts(response.data.items || []);
      setExchangeRate(response.data.exchange_rate || 1);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/marketplace/categories',
        method: 'GET',
        data: {},
      });
      setCategories(['All', ...(response.data.categories || [])]);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [currency, selectedCategory, searchQuery]);

  const formatPrice = (amount: number) => {
    const { symbol } = CURRENCY_META[currency];
    if (currency === 'USD') return `${symbol}${amount.toFixed(2)}`;
    return `${symbol} ${Math.round(amount).toLocaleString()}`;
  };

  const convertToDisplay = (usd: number) => {
    return usd * exchangeRate;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      if (newQty > item.product.stock) return item;
      return { ...item, quantity: newQty };
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price_usd * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);

    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/marketplace/checkout',
        method: 'POST',
        data: {
          items: cart.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
          currency,
        },
      });

      if (response.data.success) {
        setCheckoutComplete(true);
        toast.success('Order placed successfully!');
        setTimeout(() => {
          setCart([]);
          setCartOpen(false);
          setCheckoutComplete(false);
          fetchProducts(); // Refresh stock
        }, 3000);
      } else {
        toast.error(response.data.error || 'Checkout failed');
      }
    } catch (err) {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <AppLayout title="Yemen's Amazon — Sovereign Marketplace">
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products or vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Currency Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-card/50 border border-border/50">
              <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground ml-2" />
              {(Object.keys(CURRENCY_META) as Currency[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    currency === cur
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {CURRENCY_META[cur].label}
                </button>
              ))}
            </div>

            {/* Cart Button */}
            <Button
              variant="outline"
              onClick={() => setCartOpen(true)}
              className="relative border-primary/30 text-primary hover:bg-primary/10"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                selectedCategory === cat
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                  : "bg-card/30 text-muted-foreground border-border/30 hover:border-border/60"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Exchange Rate Banner */}
        <div className="glass-card rounded-lg p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Live Exchange Rate</span>
          <span className="text-xs font-mono text-primary">
            1 USD = {exchangeRate.toLocaleString()} {CURRENCY_META[currency].label}
          </span>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => {
              const inCart = cart.find(item => item.product.id === product.id);
              return (
                <div
                  key={product.id}
                  className="glass-card rounded-xl p-4 flex flex-col gap-3 group hover:border-primary/30 transition-all duration-300"
                >
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/5 to-violet-500/5 border border-border/20 flex items-center justify-center">
                    <Package className="w-12 h-12 text-primary/30 group-hover:text-primary/50 transition-colors" />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{product.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-border/40">
                        {product.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">by {product.vendor_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <div>
                      <p className="text-base font-bold text-primary">{formatPrice(product.price_display)}</p>
                      <p className="text-[10px] text-muted-foreground">{product.stock} in stock</p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="w-7 h-7 rounded-md bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-7 h-7 rounded-md bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-xs h-8"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cart Drawer */}
        {cartOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setCartOpen(false)} />
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col">
              <div className="h-16 flex items-center justify-between px-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Shopping Cart</h2>
                  <Badge className="bg-primary/20 text-primary text-xs">{cartCount}</Badge>
                </div>
                <button onClick={() => setCartOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Store className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="glass-card rounded-lg p-3 flex gap-3">
                      <div className="w-14 h-14 rounded-md bg-primary/5 border border-border/20 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-primary/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">{item.product.vendor_name}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-sm font-bold text-primary">
                            {formatPrice(convertToDisplay(item.product.price_usd * item.quantity))}
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-6 h-6 rounded bg-card border border-border/50 flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-6 h-6 rounded bg-card border border-border/50 flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="w-6 h-6 rounded bg-destructive/10 border border-destructive/20 flex items-center justify-center ml-1"
                            >
                              <X className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal ({CURRENCY_META[currency].label})</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(convertToDisplay(cartTotal))}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Exchange Rate</span>
                    <span>1 USD = {exchangeRate} {CURRENCY_META[currency].label}</span>
                  </div>
                  {checkoutComplete ? (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-medium text-green-400">Order Placed Successfully!</span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCheckout}
                      disabled={checkingOut}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {checkingOut ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <DollarSign className="w-4 h-4 mr-2" />
                      )}
                      {checkingOut ? 'Processing...' : `Checkout — ${formatPrice(convertToDisplay(cartTotal))}`}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}