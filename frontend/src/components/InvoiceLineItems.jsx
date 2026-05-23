import { Sparkles, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

const InvoiceLineItems = ({
  items,
  onItemChange,
  onAdd,
  onRemove,
  onAIDescription,
  availableProducts,
  currency,
}) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Items</h3>
      <button type="button" onClick={onAdd} className="btn-secondary text-sm">
        Add Item
      </button>
    </div>

    {items.map((item, index) => (
      <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-start">
        <div className="col-span-3">
          <select
            className="input-field"
            value={item.product_id || ''}
            onChange={(e) => {
              const productId = e.target.value;
              if (productId) {
                const product = availableProducts.find((p) => p.id === productId);
                if (product) {
                  onItemChange(index, 'product_id', productId);
                  onItemChange(index, 'product_name', product.name);
                  onItemChange(index, 'description', product.description);
                  onItemChange(index, 'unit_price', product.price);
                }
              } else {
                onItemChange(index, 'product_id', '');
                onItemChange(index, 'product_name', '');
              }
            }}
          >
            <option value="">Select product...</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {formatCurrency(product.price, currency)} (Stock: {product.stock})
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-3 relative">
          <input
            type="text"
            placeholder="Description"
            className="input-field pr-10"
            value={item.description}
            onChange={(e) => onItemChange(index, 'description', e.target.value)}
          />
          <button
            type="button"
            onClick={() => onAIDescription(index)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Generate with AI"
          >
            <Sparkles className="w-4 h-4 text-primary-600" />
          </button>
        </div>
        <div className="col-span-2">
          <input
            type="number"
            placeholder="Qty"
            className="input-field"
            value={item.quantity}
            onChange={(e) => onItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="col-span-2">
          <input
            type="number"
            placeholder="Price"
            className="input-field"
            value={item.unit_price}
            onChange={(e) => onItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="col-span-1">
          <input
            type="text"
            className="input-field"
            value={formatCurrency(item.total, currency)}
            readOnly
          />
        </div>
        <div className="col-span-1">
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    ))}
  </div>
);

export default InvoiceLineItems;
