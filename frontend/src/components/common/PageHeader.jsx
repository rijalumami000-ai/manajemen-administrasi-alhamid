import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PageHeader.scss';

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  extra,
  children
}) {
  const breadcrumbItems = [
    { title: <Link to="/"><Home size={14} /></Link>, path: '/' },
    ...breadcrumbs
  ];

  return (
    <div className="page-header">
      {breadcrumbs.length > 0 && (
        <nav className="page-breadcrumb">
          {breadcrumbItems.map((item, index) => (
            <span key={index} className="breadcrumb-item">
              {item.path ? <Link to={item.path}>{item.title}</Link> : item.title}
              {index < breadcrumbItems.length - 1 && <span className="separator">/</span>}
            </span>
          ))}
        </nav>
      )}

      <div className="page-header-content">
        <div className="page-header-main">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>

        {extra && (
          <div className="page-header-extra">
            {extra}
          </div>
        )}
      </div>

      {children && (
        <div className="page-header-footer">
          {children}
        </div>
      )}
    </div>
  );
}
