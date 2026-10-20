import type { Currency } from '@safer/contracts';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Search, Store } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Dialog, Empty, ErrorState, Loading, Logo } from '../../components/ui';
import { api } from '../../lib/api';
import { money } from '../../lib/money';
import '../catalogue/products.css';
interface StoreProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  amountMinor: string;
  currency: Currency;
  images: string[];
  available: boolean;
}
interface StoreData {
  business: string;
  category: string;
  products: StoreProduct[];
}
export default function Storefront() {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['storefront'],
    queryFn: () => api<StoreData>('/storefront'),
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  if (isPending) return <Loading />;
  if (error || !data)
    return (
      <ErrorState message={error?.message ?? 'Storefront unavailable.'} retry={() => refetch()} />
    );
  const categories = [...new Set(data.products.map((p) => p.category))];
  const subcategories = [
    ...new Set(
      data.products
        .filter((p) => category === 'all' || p.category === category)
        .map((p) => p.subcategory),
    ),
  ].filter(Boolean);
  const products = data.products.filter(
    (p) =>
      (category === 'all' || p.category === category) &&
      (subcategory === 'all' || p.subcategory === subcategory) &&
      `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="visitor-store">
      <div className="store-preview-bar">
        <span>
          <EyeLabel /> Visitor preview · local demo
        </span>
        <Link to="/app/catalogue">
          <ArrowLeft size={15} /> Merchant workspace
        </Link>
      </div>
      <header className="visitor-store-header">
        <Logo to="/store/demo" />
        <span>Discover something you’ll love.</span>
      </header>
      <main className="visitor-store-main">
        <section className="visitor-store-hero">
          <div className="store-merchant-mark">
            <Store size={32} />
          </div>
          <span className="store-eyebrow">WELCOME TO OUR STORE</span>
          <h1>{data.business}</h1>
          <p>{data.category}. Thoughtfully selected, just for you.</p>
          <Badge>{data.products.length} products to discover</Badge>
        </section>
        <div className="store-category-tabs" aria-label="Browse categories">
          <button
            aria-pressed={category === 'all'}
            className={category === 'all' ? 'selected' : ''}
            onClick={() => {
              setCategory('all');
              setSubcategory('all');
            }}
          >
            All products
          </button>
          {categories.map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              className={category === c ? 'selected' : ''}
              onClick={() => {
                setCategory(c);
                setSubcategory('all');
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="store-browse-toolbar">
          <label className="product-search">
            <Search size={18} />
            <input
              aria-label="Search store"
              placeholder="Find something for you…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Store subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
          >
            <option value="all">All subcategories</option>
            {subcategories.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="visitor-product-grid">
          {products.map((p) => (
            <button
              className="visitor-product"
              key={p.id}
              onClick={() => {
                setSelected(p);
                setImageIndex(0);
              }}
            >
              <div className="visitor-product-image">
                {p.images[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : <Package />}
                {!p.available && <Badge>Sold out</Badge>}
              </div>
              <div>
                <small>{p.subcategory || p.category}</small>
                <h2>{p.name}</h2>
                <strong>{money(p.amountMinor, p.currency)}</strong>
                <span className="visitor-view-details">View product</span>
              </div>
            </button>
          ))}
        </div>
        {!products.length && (
          <Empty
            title={data.products.length ? 'Nothing here just yet' : 'Something good is on its way'}
          >
            {data.products.length
              ? 'Try another search or category.'
              : 'This merchant hasn’t published any products yet. Check back soon.'}
          </Empty>
        )}
      </main>
      <footer className="visitor-store-footer">
        <Logo to="/store/demo" />
        <p>Storefront preview · browsing only. Orders and checkout are not enabled.</p>
      </footer>
      {selected && (
        <Dialog title={selected.name} onClose={() => setSelected(null)}>
          <div className="store-product-detail">
            <img
              className="store-detail-cover"
              src={selected.images[imageIndex]}
              alt={selected.name}
            />
            <div className="store-detail-thumbnails">
              {selected.images.map((image, i) => (
                <button
                  type="button"
                  key={image}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={imageIndex === i}
                  onClick={() => setImageIndex(i)}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
            <span className="muted">
              {selected.category} / {selected.subcategory}
            </span>
            <h2>{money(selected.amountMinor, selected.currency)}</h2>
            <Badge tone={selected.available ? 'success' : 'neutral'}>
              {selected.available ? 'In stock' : 'Sold out'}
            </Badge>
            <h3>About this product</h3>
            <p className="store-product-description">{selected.description}</p>
            <div className="notice">
              You’re viewing the customer experience. Ordering will be available when the live store
              is connected.
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
function EyeLabel() {
  return <Store size={14} aria-hidden="true" />;
}
