import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { inventoryService } from '../../services/inventoryService';
import { usePermission } from '../../hooks/usePermission';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import MoneyDisplay from '../../components/common/MoneyDisplay';
import SearchInput from '../../components/common/SearchInput';
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  ArrowUpDown,
  History,
  Layers,
  Archive,
} from 'lucide-react';

const partSchema = z.object({
  sku: z.string().min(1, 'SKU/Part number is required'),
  name: z.string().min(2, 'Part name is required'),
  category: z.enum(['PART', 'ACCESSORY']),
  manufacturerBrand: z.string().optional(),
  partNumber: z.string().optional(),
  compatibleVehicleType: z.enum(['TWO_WHEELER', 'FOUR_WHEELER', 'BOTH']).default('FOUR_WHEELER'),
  compatibleModels: z.string().optional(),
  unit: z.string().default('PCS'),
  preferredSupplierId: z.string().optional(),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  landedCost: z.number().min(0).optional(),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  initialStock: z.number().min(0, 'Initial stock cannot be negative'),
  reorderLevel: z.number().min(0).default(5),
  lowStockThreshold: z.number().min(0, 'Minimum stock threshold cannot be negative'),
  storageLocation: z.string().optional(),
  batchOrSerialNumber: z.string().optional(),
  warrantyInfo: z.string().optional(),
});

export function PartsListPage() {
  const dispatch = useDispatch();
  const { hasPermission } = usePermission();
  const canAdd = hasPermission('INVENTORY', 'ADD');
  const canEdit = hasPermission('INVENTORY', 'EDIT');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const {
    page,
    size,
    sortBy,
    sortDirection,
    handlePageChange,
    handleSizeChange,
    handleSort,
  } = usePagination(0, 10);

  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Part Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Stock Adjustment Modal
  const [adjustPart, setAdjustPart] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(partSchema),
    defaultValues: {
      sku: '',
      name: '',
      category: 'PART',
      manufacturerBrand: '',
      partNumber: '',
      compatibleVehicleType: 'FOUR_WHEELER',
      compatibleModels: '',
      unit: 'PCS',
      preferredSupplierId: '',
      purchasePrice: 1500,
      landedCost: 1500,
      sellingPrice: 2200,
      initialStock: 10,
      reorderLevel: 5,
      lowStockThreshold: 3,
      storageLocation: '',
      batchOrSerialNumber: '',
      warrantyInfo: '',
    },
  });

  const fetchParts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size,
        sortBy,
        sortDirection,
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        lowStockOnly: lowStockOnly ? true : undefined,
      };
      const res = await inventoryService.getAllParts(params);
      setParts(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load parts catalog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [page, size, sortBy, sortDirection, debouncedSearch, categoryFilter, lowStockOnly]);

  useEffect(() => {
    inventoryService.getAllSuppliers({ size: 100, active: true })
      .then((res) => setSuppliers(res.content || []))
      .catch(() => {});
  }, []);

  const onSubmitPart = async (data) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      const payload = {
        sku: data.sku,
        name: data.name,
        category: data.category,
        manufacturerBrand: data.manufacturerBrand || null,
        partNumber: data.partNumber || null,
        compatibleVehicleType: data.compatibleVehicleType,
        compatibleModels: data.compatibleModels || null,
        unit: data.unit || 'PCS',
        preferredSupplierId: data.preferredSupplierId ? Number(data.preferredSupplierId) : null,
        purchasePrice: Number(data.purchasePrice || 0),
        landedCost: Number(data.landedCost || data.purchasePrice || 0),
        sellingPrice: Number(data.sellingPrice || 0),
        initialStock: Number(data.initialStock || 0),
        reorderLevel: Number(data.reorderLevel || 5),
        lowStockThreshold: Number(data.lowStockThreshold || 3),
        storageLocation: data.storageLocation || null,
        batchOrSerialNumber: data.batchOrSerialNumber || null,
        warrantyInfo: data.warrantyInfo || null,
      };
      await inventoryService.createPart(payload);
      dispatch(
        addToast({
          type: 'success',
          title: 'Part Created',
          message: `${data.name} registered into inventory master.`,
        })
      );
      setIsModalOpen(false);
      reset();
      fetchParts();
    } catch (err) {
      setModalError(err.message || 'Failed to save part');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustQty || isNaN(adjustQty) || Number(adjustQty) === 0) return;
    setIsAdjusting(true);
    try {
      await inventoryService.adjustStock({
        partId: adjustPart.id,
        quantity: Number(adjustQty),
        reason: adjustReason || 'Physical stock audit adjustment',
      });
      dispatch(
        addToast({
          type: 'success',
          title: 'Stock Adjusted',
          message: `Stock for ${adjustPart.name} updated by ${adjustQty} units.`,
        })
      );
      setAdjustPart(null);
      setAdjustQty('');
      setAdjustReason('');
      fetchParts();
    } catch (err) {
      dispatch(addToast({ type: 'error', title: 'Adjustment Failed', message: err.message }));
    } finally {
      setIsAdjusting(false);
    }
  };

  const columns = [
    {
      header: 'Part / SKU',
      field: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.name}</div>
          <div className="text-muted small">
            <span className="font-monospace text-primary fw-semibold">{row.sku}</span>
            {row.manufacturerBrand ? ` • ${row.manufacturerBrand}` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Compatibility',
      field: 'compatibleVehicleType',
      render: (row) => (
        <div className="small">
          <span className="badge bg-light text-dark border me-1">
            {row.compatibleVehicleType ? row.compatibleVehicleType.replace('_', ' ') : 'FOUR WHEELER'}
          </span>
          <div className="text-muted text-truncate" style={{ maxWidth: '160px' }}>
            {row.compatibleModels || 'All Models'}
          </div>
        </div>
      ),
    },
    {
      header: 'Category / Unit',
      field: 'category',
      render: (row) => (
        <span className={`badge border ${row.category === 'ACCESSORY' ? 'bg-info-subtle text-info' : 'bg-secondary-subtle text-dark'}`}>
          {row.category} ({row.unit || 'PCS'})
        </span>
      ),
    },
    {
      header: 'Stock Status',
      field: 'currentStock',
      sortable: true,
      render: (row) => {
        const isLow = row.currentStock <= row.lowStockThreshold;
        return (
          <div className="small">
            <div className="d-flex align-items-center gap-2">
              <span className={`fw-bold font-monospace fs-6 ${isLow ? 'text-danger' : 'text-dark'}`}>
                {row.currentStock} {row.unit}
              </span>
              {isLow && (
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                  Low Stock
                </span>
              )}
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              Avail: <strong>{row.availableStock ?? row.currentStock}</strong> | Min: {row.lowStockThreshold}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Pricing (Buy / Sell)',
      field: 'purchasePrice',
      render: (row) => (
        <div className="small">
          <div>Buy: <span className="text-muted font-monospace"><MoneyDisplay amount={row.purchasePrice} /></span></div>
          <div>Sell: <strong className="text-success font-monospace"><MoneyDisplay amount={row.sellingPrice} /></strong></div>
        </div>
      ),
    },
    {
      header: 'Storage / Supplier',
      field: 'preferredSupplierName',
      render: (row) => (
        <div className="small">
          <div className="text-dark fw-semibold">{row.preferredSupplierName || 'Direct / General'}</div>
          <div className="text-muted">Loc: {row.storageLocation || 'Bin Main'}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      field: 'id',
      render: (row) => (
        canEdit && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary py-0 px-2 d-flex align-items-center gap-1"
            onClick={() => setAdjustPart(row)}
            title="Adjust Stock"
          >
            <SlidersHorizontal size={13} /> Adjust
          </button>
        )
      ),
    },
  ];

  const handleOpenAddModal = () => {
    setModalError(null);
    reset({
      sku: '',
      name: '',
      category: 'PART',
      manufacturerBrand: '',
      partNumber: '',
      compatibleVehicleType: 'FOUR_WHEELER',
      compatibleModels: '',
      unit: 'PCS',
      preferredSupplierId: '',
      purchasePrice: 1500,
      landedCost: 1500,
      sellingPrice: 2200,
      initialStock: 10,
      reorderLevel: 5,
      lowStockThreshold: 3,
      storageLocation: '',
      batchOrSerialNumber: '',
      warrantyInfo: '',
    });
    // Ensure suppliers list is always fresh
    inventoryService.getAllSuppliers({ size: 100, active: true })
      .then((res) => setSuppliers(res.content || []))
      .catch(() => {});
    setIsModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Spare Parts & Inventory Master"
        subtitle="Track stock on hand, reserved quantities, reorder thresholds, compatibility, and valuations"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Inventory' }, { label: 'Parts' }]}
      >
        {canAdd && (
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-1"
            onClick={handleOpenAddModal}
          >
            <Plus size={16} /> Add Spare Part
          </button>
        )}
      </PageHeader>

      {/* Filter Bar */}
      <div className="app-card p-3 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by part name, SKU, brand, or part #..."
            />
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="PART">Spare Parts</option>
              <option value="ACCESSORY">Accessories</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <div className="form-check pt-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="lowStockCheck"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              <label className="form-check-label text-danger small fw-semibold" htmlFor="lowStockCheck">
                Low Stock Items Only
              </label>
            </div>
          </div>
          <div className="col-12 col-md-2 text-md-end text-muted small">
            Total: <strong>{totalElements}</strong> items
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <DataTable
        columns={columns}
        data={parts}
        loading={isLoading}
        error={error}
        totalItems={totalElements}
        totalPages={totalPages}
        currentPage={page}
        pageSize={size}
        onPageChange={handlePageChange}
        onPageSizeChange={handleSizeChange}
        onSort={handleSort}
        sortBy={sortBy}
        sortDirection={sortDirection}
        emptyMessage="No spare parts match the filter criteria."
      />

      {/* Stock Adjustment Modal */}
      {adjustPart && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">Stock Reconciliation / Adjustment</h5>
                <button type="button" className="btn-close" onClick={() => setAdjustPart(null)} />
              </div>
              <form onSubmit={handleStockAdjustment}>
                <div className="modal-body p-4">
                  <div className="alert alert-light border py-2 px-3 small rounded-3 mb-3">
                    Adjusting stock for: <strong>{adjustPart.name}</strong> ({adjustPart.sku})<br />
                    Current Physical Stock: <strong>{adjustPart.currentStock} {adjustPart.unit}</strong>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="adjQty">
                      Adjustment Quantity (+ to add, - to deduct)*
                    </label>
                    <input
                      id="adjQty"
                      type="number"
                      className="form-control font-monospace"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                      placeholder="e.g. 5 or -2"
                      required
                    />
                    <div className="form-text small">Enter positive integer to increase stock, negative to deduct.</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="adjReason">
                      Authorized Reason / Audit Note*
                    </label>
                    <textarea
                      id="adjReason"
                      className="form-control"
                      rows="2"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="e.g. Physical inventory count correction or damaged parts disposal"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setAdjustPart(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isAdjusting}>
                    {isAdjusting ? 'Saving...' : 'Apply Stock Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Part Modal */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1050 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: '90vh' }}>
            <form onSubmit={handleSubmit(onSubmitPart)} className="modal-content border-0 shadow rounded-3 d-flex flex-column" style={{ maxHeight: '90vh' }}>
              <div className="modal-header border-bottom flex-shrink-0">
                <h5 className="modal-title h6 fw-bold">Register Spare Part / Item</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} />
              </div>
              <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
                {modalError && <div className="alert alert-danger small py-2 px-3 mb-3">{modalError}</div>}

                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="partSku">Part SKU / Code*</label>
                      <input
                        id="partSku"
                        type="text"
                        className={`form-control font-monospace ${errors.sku ? 'is-invalid' : ''}`}
                        placeholder="e.g. BRK-PAD-BOSCH"
                        {...register('sku')}
                      />
                      {errors.sku && <div className="invalid-feedback">{errors.sku.message}</div>}
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label" htmlFor="pName">Part Name*</label>
                      <input
                        id="pName"
                        type="text"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="e.g. Bosch Front Ceramic Brake Pads Set"
                        {...register('name')}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="cat">Category*</label>
                      <select id="cat" className="form-select" {...register('category')}>
                        <option value="PART">Spare Part</option>
                        <option value="ACCESSORY">Accessory</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="brand">Manufacturer / Brand</label>
                      <input id="brand" type="text" className="form-control" placeholder="e.g. Bosch / Amaron / MRF" {...register('manufacturerBrand')} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="partNum">OEM Part #</label>
                      <input id="partNum" type="text" className="form-control font-monospace" placeholder="e.g. 0986AB123" {...register('partNumber')} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="vehType">Compatible Vehicle Type</label>
                      <select id="vehType" className="form-select" {...register('compatibleVehicleType')}>
                        <option value="FOUR_WHEELER">Four-Wheeler (Car)</option>
                        <option value="TWO_WHEELER">Two-Wheeler (Bike)</option>
                        <option value="BOTH">Universal / Both</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label" htmlFor="models">Compatible Makes / Models</label>
                      <input id="models" type="text" className="form-control" placeholder="e.g. Hyundai Creta, Kia Seltos, Maruti Brezza" {...register('compatibleModels')} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="uom">Unit of Measurement</label>
                      <select id="uom" className="form-select" {...register('unit')}>
                        <option value="PCS">PCS (Pieces)</option>
                        <option value="SET">SET</option>
                        <option value="LTR">LTR (Litres)</option>
                        <option value="BOX">BOX</option>
                        <option value="PAIR">PAIR</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label" htmlFor="supplierSelect">Preferred Supplier Agency</label>
                      <select id="supplierSelect" className="form-select" {...register('preferredSupplierId')}>
                        <option value="">Select Preferred Supplier</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.supplierCode || 'SUP'})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="buyPrice">Purchase Price (₹)*</label>
                      <input
                        id="buyPrice"
                        type="number"
                        step="0.01"
                        className={`form-control ${errors.purchasePrice ? 'is-invalid' : ''}`}
                        {...register('purchasePrice', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="sellPrice">Selling Price (₹)*</label>
                      <input
                        id="sellPrice"
                        type="number"
                        step="0.01"
                        className={`form-control ${errors.sellingPrice ? 'is-invalid' : ''}`}
                        {...register('sellingPrice', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="initStock">Initial Opening Stock</label>
                      <input
                        id="initStock"
                        type="number"
                        className="form-control"
                        {...register('initialStock', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="minThresh">Low Stock Threshold</label>
                      <input
                        id="minThresh"
                        type="number"
                        className="form-control"
                        {...register('lowStockThreshold', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="reord">Reorder Level</label>
                      <input
                        id="reord"
                        type="number"
                        className="form-control"
                        {...register('reorderLevel', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label" htmlFor="binLoc">Storage Location / Bin #</label>
                      <input id="binLoc" type="text" className="form-control" placeholder="Rack B, Shelf 3" {...register('storageLocation')} />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="batchNo">Batch or Serial Number</label>
                      <input id="batchNo" type="text" className="form-control" placeholder="Batch / Lot #" {...register('batchOrSerialNumber')} />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="warranty">Warranty Information</label>
                      <input id="warranty" type="text" className="form-control" placeholder="e.g. 1 Year Manufacturer Replacement" {...register('warrantyInfo')} />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top flex-shrink-0">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Register Part'}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartsListPage;
