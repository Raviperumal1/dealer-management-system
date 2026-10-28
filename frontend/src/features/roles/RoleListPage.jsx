import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../ui/uiSlice';
import { userService } from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import LoadingState from '../../components/common/LoadingState';
import { Settings, Shield, Sliders, CheckCircle2, Save } from 'lucide-react';

export function RoleListPage() {
  const dispatch = useDispatch();

  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Permissions Matrix Editor State
  const [editingRole, setEditingRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRolesData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [roleData, menuData] = await Promise.all([
        userService.getAllRoles(),
        userService.getAllMenus().catch(() => []),
      ]);
      setRoles(roleData || []);
      setMenus(menuData || []);
    } catch (err) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const handleOpenPermissions = async (role) => {
    try {
      const detail = await userService.getRoleById(role.id);
      setEditingRole(role);

      // Map menus with existing role permissions or defaults
      const permsMap = (detail.permissions || []).reduce((acc, p) => {
        acc[p.menuCode] = p;
        return acc;
      }, {});

      const initialPerms = menus.map((m) => {
        const existing = permsMap[m.code] || {};
        return {
          menuId: m.id,
          menuCode: m.code,
          menuName: m.name,
          canView: Boolean(existing.canView),
          canAdd: Boolean(existing.canAdd),
          canEdit: Boolean(existing.canEdit),
          canDelete: Boolean(existing.canDelete),
          canPay: Boolean(existing.canPay),
          canExport: Boolean(existing.canExport),
          canChangeStatus: Boolean(existing.canChangeStatus),
        };
      });

      setRolePermissions(initialPerms);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to load role permissions' }));
    }
  };

  const handleTogglePerm = (menuCode, action) => {
    setRolePermissions((prev) =>
      prev.map((p) => {
        if (p.menuCode === menuCode) {
          return { ...p, [action]: !p[action] };
        }
        return p;
      })
    );
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    setIsSubmitting(true);
    try {
      const payloadPermissions = rolePermissions.map((p) => ({
        menuId: p.menuId,
        canView: Boolean(p.canView),
        canAdd: Boolean(p.canAdd),
        canEdit: Boolean(p.canEdit),
        canDelete: Boolean(p.canDelete),
        canPay: Boolean(p.canPay),
        canExport: Boolean(p.canExport),
        canChangeStatus: Boolean(p.canChangeStatus),
      }));
      await userService.updateRolePermissions(editingRole.id, payloadPermissions);
      dispatch(
        addToast({
          type: 'success',
          title: 'Permissions Saved',
          message: `Permissions updated for ${editingRole.name}.`,
        })
      );
      setEditingRole(null);
      fetchRolesData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to update permissions' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Role Code',
      field: 'name',
      render: (row) => (
        <span className="badge bg-primary-subtle text-primary border font-monospace fs-6 px-2 py-1">
          {row.name}
        </span>
      ),
    },
    {
      header: 'Description',
      field: 'description',
      render: (row) => row.description || 'System access role',
    },
    {
      header: 'Assigned Menus',
      field: 'permissions',
      render: (row) => (
        <span className="badge bg-light text-dark border">
          {row.permissions?.filter((p) => p.canView)?.length || 0} Menus Allowed
        </span>
      ),
    },
    {
      header: 'Actions',
      field: 'actions',
      className: 'text-end',
      render: (row) => (
        <div className="d-flex justify-content-end gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            onClick={() => handleOpenPermissions(row)}
          >
            <Sliders size={14} /> Configure Permissions
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Role & Permission Matrix"
        subtitle="Manage Role-Based Access Control (RBAC) and granular menu action entitlements matching Slide 15"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin' },
          { label: 'Roles & Permissions' },
        ]}
      />

      {/* Roles & Permissions Metric Ribbon */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-4">
          <div className="kpi-card py-2.5 px-3">
            <div>
              <div className="kpi-label" style={{ fontSize: '0.72rem' }}>Configured Roles</div>
              <div className="kpi-value fs-5 mt-0.5 text-primary">{roles.length}</div>
              <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Active authorization tiers</span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-primary" style={{ width: '36px', height: '36px' }}>
              <Shield size={18} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="kpi-card py-2.5 px-3">
            <div>
              <div className="kpi-label" style={{ fontSize: '0.72rem' }}>Governed Business Modules</div>
              <div className="kpi-value fs-5 mt-0.5 text-dark">{menus.length || 10}</div>
              <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Core operational domains</span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-info" style={{ width: '36px', height: '36px' }}>
              <Sliders size={18} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="kpi-card py-2.5 px-3">
            <div>
              <div className="kpi-label" style={{ fontSize: '0.72rem' }}>Security Protocol</div>
              <div className="kpi-value fs-5 mt-0.5 text-success">Slide 15 RBAC</div>
              <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Granular action entitlements</span>
            </div>
            <div className="kpi-icon-wrapper kpi-icon-success" style={{ width: '36px', height: '36px' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        isLoading={isLoading}
        error={error}
        onRetry={fetchRolesData}
        emptyTitle="No roles found"
      />

      {/* Permissions Matrix Configuration Modal */}
      {editingRole && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 1060 }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold">
                  Configure Permissions: {editingRole.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingRole(null)}
                />
              </div>

              <div className="modal-body p-0">
                <div className="p-3 bg-light border-bottom small text-muted">
                  Check authorized actions for each business module. Changes take effect on user next login or refresh.
                </div>
                <div className="table-responsive" style={{ maxHeight: '450px' }}>
                  <table className="app-table table mb-0">
                    <thead className="position-sticky top-0 bg-light">
                      <tr>
                        <th>Module</th>
                        <th className="text-center">View</th>
                        <th className="text-center">Add</th>
                        <th className="text-center">Edit</th>
                        <th className="text-center">Delete</th>
                        <th className="text-center">Pay</th>
                        <th className="text-center">Export</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rolePermissions.map((p) => (
                        <tr key={p.menuCode}>
                          <td>
                            <div className="fw-semibold text-dark">{p.menuName || p.menuCode}</div>
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>{p.menuCode}</span>
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={p.canView}
                              onChange={() => handleTogglePerm(p.menuCode, 'canView')}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={p.canAdd}
                              onChange={() => handleTogglePerm(p.menuCode, 'canAdd')}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={p.canEdit}
                              onChange={() => handleTogglePerm(p.menuCode, 'canEdit')}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={p.canDelete}
                              onChange={() => handleTogglePerm(p.menuCode, 'canDelete')}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={p.canPay}
                              onChange={() => handleTogglePerm(p.menuCode, 'canPay')}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={p.canExport}
                              onChange={() => handleTogglePerm(p.menuCode, 'canExport')}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={p.canChangeStatus}
                              onChange={() => handleTogglePerm(p.menuCode, 'canChangeStatus')}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer bg-light border-0">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setEditingRole(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                  onClick={handleSavePermissions}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save size={14} /> Save Permission Matrix
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleListPage;
