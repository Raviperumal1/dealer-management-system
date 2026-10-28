import { describe, it, expect } from 'vitest';
import { isAdmin, hasPermission, hasRole } from '../utils/permissions';

describe('permissions utility', () => {
  it('correctly identifies admin users', () => {
    expect(isAdmin(['ROLE_ADMIN'])).toBe(true);
    expect(isAdmin(['ADMIN'])).toBe(true);
    expect(isAdmin(['ROLE_STAFF'])).toBe(false);
    expect(isAdmin([])).toBe(false);
  });

  it('allows all actions for admin roles', () => {
    const roles = ['ROLE_ADMIN'];
    const permissions = [];
    expect(hasPermission(permissions, roles, 'VEHICLES', 'DELETE')).toBe(true);
    expect(hasPermission(permissions, roles, 'BROKERS', 'VIEW')).toBe(true);
    expect(hasPermission(permissions, roles, 'ADMIN', 'VIEW')).toBe(true);
  });

  it('evaluates fine-grained staff permissions accurately', () => {
    const roles = ['ROLE_STAFF'];
    const permissions = [
      {
        menuCode: 'VEHICLES',
        canView: true,
        canAdd: true,
        canEdit: false,
        canDelete: false,
      },
      {
        menuCode: 'SALES',
        canView: true,
        canAdd: true,
        canEdit: true,
        canPay: true,
      },
    ];

    expect(hasPermission(permissions, roles, 'VEHICLES', 'VIEW')).toBe(true);
    expect(hasPermission(permissions, roles, 'VEHICLES', 'ADD')).toBe(true);
    expect(hasPermission(permissions, roles, 'VEHICLES', 'DELETE')).toBe(false);

    expect(hasPermission(permissions, roles, 'SALES', 'PAY')).toBe(true);
    expect(hasPermission(permissions, roles, 'BROKERS', 'VIEW')).toBe(false);
  });

  it('checks role names flexibly with or without prefix', () => {
    expect(hasRole(['ROLE_STAFF'], 'STAFF')).toBe(true);
    expect(hasRole(['STAFF'], 'STAFF')).toBe(true);
    expect(hasRole(['ROLE_MANAGER'], 'STAFF')).toBe(false);
  });
});
