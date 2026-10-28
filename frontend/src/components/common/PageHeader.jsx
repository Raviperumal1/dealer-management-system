import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageHeader.css';

/**
 * PageHeader - Universal Executive Master Header Component
 * Standardized across all pages in the Dealer Management System:
 * - High-taste executive white card container (16px border-radius, soft elevation)
 * - Structured navigation breadcrumb trail with link navigation
 * - Prominent typography & descriptive operational subtitle
 * - Coordinated action container (view switchers, primary + secondary CTA buttons)
 */
export function PageHeader({ title, subtitle, children, breadcrumbs = [] }) {
  const navigate = useNavigate();

  return (
    <header className="page-master-header">
      <div className="page-master-title-group">
        {breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="page-master-breadcrumbs">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {crumb.href && !isLast ? (
                    <a
                      href={crumb.href}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(crumb.href);
                      }}
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className={isLast ? 'active' : ''}>{crumb.label}</span>
                  )}
                  {!isLast && <span className="breadcrumb-sep">›</span>}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <h1 className="page-master-title">{title}</h1>
        {subtitle && <p className="page-master-subtitle">{subtitle}</p>}
      </div>

      {children && <div className="page-master-actions">{children}</div>}
    </header>
  );
}

export default PageHeader;
