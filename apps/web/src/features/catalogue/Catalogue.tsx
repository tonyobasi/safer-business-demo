import { itemSchema, type Item } from '@safer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { Button, Dialog, Empty, PageHeading, SummaryCard, useToast } from '../../components/ui';
import { api, useWorkspace } from '../../lib/api';
export function StockForm({ item, onDone }: { item: Item; onDone: () => void }) {
  const [kind, setKind] = useState<'sale' | 'restock'>('sale');
  const [quantity, setQuantity] = useState('1');
  const client = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: () => api(`/catalogue/${item.id}/movements`, { kind, quantity: Number(quantity) }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      toast(
        kind === 'sale'
          ? 'Sale recorded. Your stock is up to date.'
          : 'Stock added to your catalogue.',
      );
      onDone();
    },
  });
  return (
    <form
      className="stack-form"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="stock-item-preview">
        {item.image ? (
          <img src={item.image} alt="" />
        ) : (
          <div className="list-icon">
            <Package />
          </div>
        )}
        <div>
          <strong>{item.name}</strong>
          <p>
            {item.remaining} remaining · {item.sold} sold
          </p>
        </div>
      </div>
      <div className="segmented">
        <button
          type="button"
          className={kind === 'sale' ? 'selected' : ''}
          aria-pressed={kind === 'sale'}
          onClick={() => setKind('sale')}
        >
          Record sale
        </button>
        <button
          type="button"
          className={kind === 'restock' ? 'selected' : ''}
          aria-pressed={kind === 'restock'}
          onClick={() => setKind('restock')}
        >
          Add stock
        </button>
      </div>
      <label>
        Quantity
        <input
          type="number"
          min={1}
          max={kind === 'sale' ? item.remaining : 100000}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </label>
      <div className="notice">
        {kind === 'sale'
          ? 'Recording a sale changes stock only. It does not mark a payment as received.'
          : 'Adding stock increases the number of items available.'}
      </div>
      {mutation.error && (
        <p className="form-error" role="alert">
          {mutation.error.message}
        </p>
      )}
      <Button disabled={mutation.isPending || (kind === 'sale' && item.remaining === 0)}>
        {mutation.isPending
          ? 'Updating…'
          : kind === 'sale'
            ? 'Confirm and record sale'
            : 'Confirm and add stock'}
      </Button>
    </form>
  );
}
export default function Catalogue() {
  const { data } = useWorkspace();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<Item | null>(null);
  const [picker, setPicker] = useState(false);
  const [add, setAdd] = useState(false);
  if (!data) return null;
  const items = data.items.filter(
    (i) =>
      (category === 'all' || i.category === category) &&
      `${i.name} ${i.sku}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="page-content catalogue-page">
      <PageHeading
        title="Your catalogue"
        description="Your private stock record. See what sold and what’s left."
      />
      <div className="summary-grid">
        <SummaryCard label="Items tracked" value={String(data.items.length)} />
        <SummaryCard
          label="Items sold"
          value={String(data.items.reduce((s, i) => s + i.sold, 0))}
        />
        <SummaryCard
          label="Remaining stock"
          value={String(data.items.reduce((s, i) => s + i.remaining, 0))}
        />
      </div>
      <div className="catalogue-actions">
        <Button onClick={() => setAdd(true)}>Add item</Button>
        <Button variant="secondary" onClick={() => setPicker(true)}>
          Record sale
        </Button>
        <Button variant="secondary" onClick={() => setPicker(true)}>
          Adjust stock
        </Button>
      </div>
      <div className="toolbar">
        <input
          aria-label="Search catalogue"
          placeholder="Enter an item name or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={category}
          aria-label="Filter by category"
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          <option>Clothing</option>
          <option>Accessories</option>
          <option>Other</option>
        </select>
      </div>
      <div className="card table-scroll">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Total recorded</th>
              <th>Sold</th>
              <th>Remaining</th>
              <th>
                <span className="sr-only">Update item</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>
                  <strong>{i.name}</strong>
                  <small>{i.sku}</small>
                </td>
                <td>{i.sold + i.remaining}</td>
                <td>{i.sold}</td>
                <td>
                  <span className={i.remaining < 10 ? 'low-stock-number' : ''}>{i.remaining}</span>
                </td>
                <td>
                  <Button variant="ghost" onClick={() => setSelected(i)}>
                    Update stock
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <Empty title="No matching items">
            Try another name or category, or add your first item.
          </Empty>
        )}
      </div>
      <p className="security-footnote">
        <Package size={13} />
        Your catalogue is private. Customers only see the payment links you share.
      </p>
      {selected && (
        <Dialog title="Update your stock" onClose={() => setSelected(null)}>
          <StockForm item={selected} onDone={() => setSelected(null)} />
        </Dialog>
      )}
      {picker && (
        <Dialog title="Choose an item to update" onClose={() => setPicker(false)}>
          <div className="stock-mini-list">
            {data.items.map((i) => (
              <button
                className="item-picker-row"
                key={i.id}
                onClick={() => {
                  setPicker(false);
                  setSelected(i);
                }}
              >
                <span>{i.name}</span>
                <small>{i.remaining} remaining</small>
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {add && (
        <Dialog title="Add a catalogue item" onClose={() => setAdd(false)}>
          <AddItem onDone={() => setAdd(false)} />
        </Dialog>
      )}
    </div>
  );
}
function AddItem({ onDone }: { onDone: () => void }) {
  const [error, setError] = useState('');
  const client = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (v: unknown) => api('/catalogue', v),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      toast('Item added to your private catalogue.');
      onDone();
    },
  });
  return (
    <form
      className="stack-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const v = {
          name: f.get('name'),
          sku: f.get('sku'),
          category: f.get('category'),
          quantity: Number(f.get('quantity')),
          amount: f.get('amount'),
          currency: f.get('currency'),
        };
        const result = itemSchema.safeParse(v);
        if (!result.success) {
          setError(result.error.issues[0].message);
          return;
        }
        setError('');
        mutation.mutate(result.data);
      }}
    >
      <label>
        Item name
        <input name="name" minLength={3} maxLength={100} required placeholder="Linen set" />
      </label>
      <div className="form-row">
        <label>
          SKU
          <input name="sku" minLength={3} maxLength={32} required placeholder="ADA-LIN-005" />
        </label>
        <label>
          Category
          <select name="category">
            <option>Clothing</option>
            <option>Accessories</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Opening stock
          <input
            name="quantity"
            type="number"
            min={0}
            max={100000}
            step={1}
            defaultValue={0}
            required
          />
        </label>
        <label>
          Item price
          <input name="amount" inputMode="decimal" defaultValue="0.00" required />
        </label>
      </div>
      <label>
        Price currency
        <select name="currency">
          <option>NGN</option>
          <option>USD</option>
        </select>
      </label>
      {(error || mutation.error) && (
        <p className="form-error" role="alert">
          {error || mutation.error?.message}
        </p>
      )}
      <Button disabled={mutation.isPending}>Add item</Button>
    </form>
  );
}
