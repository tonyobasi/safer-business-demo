import type { Item } from '@safer/contracts';
import { Eye, Package, Plus, Search, Store } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Dialog, Empty, PageHeading } from '../../components/ui';
import { useWorkspace } from '../../lib/api';
import { money } from '../../lib/money';
import { StockForm } from './Catalogue';
import ProductEditor from './ProductEditor';
import './products.css';
export default function ProductManager() {
  const { data } = useWorkspace();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [editor, setEditor] = useState<Item | 'new' | null>(null);
  const [stock, setStock] = useState<Item | null>(null);
  if (!data) return null;
  const categories = [...new Set(data.items.map((i) => i.category))];
  const items = data.items.filter(
    (i) =>
      (category === 'all' || i.category === category) &&
      (visibility === 'all' || (i.visibility ?? 'draft') === visibility) &&
      `${i.name} ${i.sku} ${i.subcategory ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );
  const published = data.items.filter((i) => i.visibility === 'published').length;
  return (
    <div className="page-content merchant-products">
      <PageHeading
        eyebrow="Your products. Ready for the world."
        title="Products & storefront"
        description="Build your collection, manage stock, and choose what customers see."
        action={
          <Button onClick={() => setEditor('new')}>
            <Plus size={17} /> Add product
          </Button>
        }
      />
      <section className="merchant-store-banner">
        <div className="store-banner-icon">
          <Store size={27} />
        </div>
        <div>
          <span>YOUR STOREFRONT</span>
          <h2>{data.profile.business}</h2>
          <p>
            {data.profile.category} · {published} published{' '}
            {published === 1 ? 'product' : 'products'}
          </p>
        </div>
        <Link className="store-preview-link" to="/store/demo">
          <Eye size={17} /> View as visitor
        </Link>
      </section>
      <div className="product-stat-grid">
        <div>
          <span>Total products</span>
          <strong>{data.items.length}</strong>
        </div>
        <div>
          <span>Published</span>
          <strong>{published}</strong>
        </div>
        <div>
          <span>Drafts</span>
          <strong>{data.items.length - published}</strong>
        </div>
        <div>
          <span>Low stock</span>
          <strong>{data.items.filter((i) => i.remaining < 10).length}</strong>
        </div>
      </div>
      <div className="product-controls">
        <label className="product-search">
          <Search size={18} />
          <input
            aria-label="Search products"
            placeholder="Search title, SKU or subcategory"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Product visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="all">All products</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <select
          aria-label="Product category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <p className="product-result-count">
        {items.length} {items.length === 1 ? 'product' : 'products'}
      </p>
      <div className="merchant-product-grid">
        {items.map((item) => (
          <article className="merchant-product-card" key={item.id}>
            <div className="product-card-image">
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className="product-image-empty">
                  <Package size={34} />
                  <span>Add product photos</span>
                </div>
              )}
              <Badge tone={item.visibility === 'published' ? 'success' : 'neutral'}>
                {item.visibility === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <div className="product-card-content">
              <small>
                {item.category}
                {item.subcategory ? ` / ${item.subcategory}` : ''}
              </small>
              <h3>{item.name}</h3>
              <strong className="product-price">{money(item.amountMinor, item.currency)}</strong>
              <div className="product-stock-line">
                <span>{item.remaining} in stock</span>
                <span>{item.sold} sold</span>
              </div>
              <div className="product-card-actions">
                <Button variant="secondary" onClick={() => setEditor(item)}>
                  Edit product
                </Button>
                <Button variant="ghost" onClick={() => setStock(item)}>
                  Stock
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!items.length && (
        <Empty
          title="Make room for your next bestseller"
          action={<Button onClick={() => setEditor('new')}>Add a product</Button>}
        >
          Add photos and details, then publish when you’re ready.
        </Empty>
      )}
      <p className="product-demo-note">
        Your demo storefront is a visitor preview in this browser. Drafts, SKUs and stock records
        stay in your merchant workspace.
      </p>
      {editor && (
        <Dialog
          title={editor === 'new' ? 'Add a product' : 'Edit product'}
          onClose={() => setEditor(null)}
        >
          <ProductEditor
            item={editor === 'new' ? undefined : editor}
            businessType={data.profile.category}
            onDone={() => setEditor(null)}
          />
        </Dialog>
      )}
      {stock && (
        <Dialog title="Update your stock" onClose={() => setStock(null)}>
          <StockForm item={stock} onDone={() => setStock(null)} />
        </Dialog>
      )}
    </div>
  );
}
