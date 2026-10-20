import { type Item } from '@safer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { Button, useToast } from '../../components/ui';
import { api } from '../../lib/api';
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
