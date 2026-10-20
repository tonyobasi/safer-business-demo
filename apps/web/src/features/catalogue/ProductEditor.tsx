import { productSchema, type Item, type ProductInput } from '@safer/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react';
import { useState } from 'react';
import { Button, useToast } from '../../components/ui';
import { api } from '../../lib/api';
import { businessCategories, categoriesFor } from './categories';

async function prepareImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Choose JPG, PNG or WebP images.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Each source image must be under 8 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not process this image.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL('image/jpeg', 0.78);
    if (image.length > 600000)
      throw new Error('This image is too detailed. Choose a smaller image.');
    return image;
  } finally {
    bitmap.close();
  }
}
export default function ProductEditor({
  item,
  businessType,
  onDone,
}: {
  item?: Item;
  businessType: string;
  onDone: () => void;
}) {
  const initialType =
    item?.businessType ?? (businessCategories[businessType] ? businessType : 'Other');
  const initialTaxonomy = categoriesFor(initialType);
  const initialCategory =
    item && initialTaxonomy[item.category] ? item.category : Object.keys(initialTaxonomy)[0];
  const [value, setValue] = useState<ProductInput>({
    name: item?.name ?? '',
    sku: item?.sku ?? '',
    description: item?.description ?? '',
    businessType: initialType,
    category: initialCategory,
    subcategory:
      item?.subcategory && initialTaxonomy[initialCategory].includes(item.subcategory)
        ? item.subcategory
        : initialTaxonomy[initialCategory][0],
    quantity: item?.remaining ?? 0,
    amount: item ? (Number(item.amountMinor) / 100).toFixed(2) : '',
    currency: item?.currency ?? 'NGN',
    images: item?.images ?? (item?.image ? [item.image] : []),
    visibility: item?.visibility ?? 'draft',
  });
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const client = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (input: ProductInput) =>
      api(item ? `/products/${item.id}` : '/products', input, item ? 'PUT' : 'POST'),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['workspace'] });
      client.invalidateQueries({ queryKey: ['storefront'] });
      toast(
        value.visibility === 'published'
          ? 'Product saved. The visitor storefront is currently archived.'
          : 'Product saved as a draft.',
      );
      onDone();
    },
  });
  const update = <K extends keyof ProductInput>(key: K, next: ProductInput[K]) =>
    setValue((v) => ({ ...v, [key]: next }));
  const taxonomy = categoriesFor(value.businessType);
  return (
    <form
      className="stack-form product-editor"
      onSubmit={(event) => {
        event.preventDefault();
        const result = productSchema.safeParse(value);
        if (!result.success) {
          setError(result.error.issues[0].message);
          return;
        }
        setError('');
        mutation.mutate(result.data);
      }}
    >
      <section className="product-editor-section">
        <h3>Product images</h3>
        <p className="muted">
          Up to 4 images. The first image is your cover. JPG, PNG or WebP, up to 8 MB each.
        </p>
        <div className="product-image-strip">
          {value.images.map((image, index) => (
            <div className="product-image-tile" key={image}>
              <img src={image} alt={`Product image ${index + 1}`} />
              <button
                type="button"
                className="image-remove"
                aria-label={`Remove image ${index + 1}`}
                onClick={() =>
                  update(
                    'images',
                    value.images.filter((_, i) => i !== index),
                  )
                }
              >
                <X size={15} />
              </button>
              {index === 0 ? (
                <span>Cover</span>
              ) : (
                <button
                  type="button"
                  className="image-cover"
                  onClick={() =>
                    update('images', [image, ...value.images.filter((_, i) => i !== index)])
                  }
                >
                  Make cover
                </button>
              )}
            </div>
          ))}
          {value.images.length < 4 && (
            <label className="product-upload">
              <ImagePlus size={24} />
              <strong>{uploading ? 'Preparing…' : 'Add images'}</strong>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading || mutation.isPending}
                onChange={async (event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = '';
                  if (!files.length) return;
                  if (files.length + value.images.length > 4) {
                    setError('Choose up to 4 images in total.');
                    return;
                  }
                  setUploading(true);
                  setError('');
                  try {
                    const images = await Promise.all(files.map(prepareImage));
                    setValue((v) => ({ ...v, images: [...v.images, ...images] }));
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Unable to read this image.');
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
          )}
        </div>
        <small className="muted">Images are resized and saved on this browser for the demo.</small>
      </section>
      <section className="product-editor-section">
        <h3>The product details</h3>
        <label>
          Product title
          <input
            value={value.name}
            maxLength={100}
            minLength={3}
            required
            placeholder="e.g. Everyday linen two-piece"
            onChange={(e) => update('name', e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            value={value.description}
            rows={4}
            maxLength={2000}
            placeholder="Tell customers about the material, size, features, care or what is included."
            onChange={(e) => update('description', e.target.value)}
          />
          <small>{value.description.length}/2000</small>
        </label>
        <div className="form-row">
          <label>
            Price
            <input
              inputMode="decimal"
              value={value.amount}
              required
              placeholder="0.00"
              onChange={(e) => update('amount', e.target.value)}
            />
          </label>
          <label>
            Currency
            <select
              value={value.currency}
              onChange={(e) => update('currency', e.target.value as ProductInput['currency'])}
            >
              {['NGN', 'USD', 'EUR', 'USDC'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="product-editor-section">
        <h3>Organise your product</h3>
        <label>
          Business type
          <select
            value={value.businessType}
            onChange={(e) => {
              const type = e.target.value;
              const categories = categoriesFor(type);
              const category = Object.keys(categories)[0];
              setValue((v) => ({
                ...v,
                businessType: type,
                category,
                subcategory: categories[category][0],
              }));
            }}
          >
            {Object.keys(businessCategories).map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Category
            <select
              value={value.category}
              onChange={(e) =>
                setValue((v) => ({
                  ...v,
                  category: e.target.value,
                  subcategory: taxonomy[e.target.value][0],
                }))
              }
            >
              {Object.keys(taxonomy).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Subcategory
            <select
              value={value.subcategory}
              onChange={(e) => update('subcategory', e.target.value)}
            >
              {taxonomy[value.category].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            SKU
            <input
              value={value.sku}
              required
              minLength={3}
              maxLength={32}
              placeholder="e.g. LIN-001"
              onChange={(e) => update('sku', e.target.value)}
            />
          </label>
          <label>
            {item ? 'Current stock' : 'Opening stock'}
            <input
              type="number"
              min={0}
              max={100000}
              step={1}
              required
              disabled={!!item}
              value={value.quantity}
              onChange={(e) => update('quantity', Number(e.target.value))}
            />
          </label>
        </div>
        {item && (
          <small className="muted">
            Use “Stock” on the product card to record a sale or add stock.
          </small>
        )}
      </section>
      <section className="product-publishing">
        <h3>Saved publication setting</h3>
        <label>
          Publication status
          <select
            value={value.visibility}
            onChange={(e) => update('visibility', e.target.value as ProductInput['visibility'])}
          >
            <option value="draft">Draft · only you can see it</option>
            <option value="published">Published · storefront archived</option>
          </select>
        </label>
        <p>
          The visitor storefront is archived. Publication settings are saved for when it is
          restored.
        </p>
      </section>
      {(error || mutation.error) && (
        <p role="alert" className="form-error">
          {error || mutation.error?.message}
        </p>
      )}
      <div className="product-editor-footer">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={uploading || mutation.isPending}>
          {mutation.isPending
            ? 'Saving…'
            : value.visibility === 'published'
              ? 'Save & publish'
              : 'Save draft'}
        </Button>
      </div>
    </form>
  );
}
