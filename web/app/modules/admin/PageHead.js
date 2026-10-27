// Title + one-line explanation at the top of every Panel Admin page.
export default function PageHead({ title, children, actions }) {
  return (
    <header className="page-head">
      <div>
        <h1>{title}</h1>
        {children && <p className="muted">{children}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function ReadOnlyNote({ admin }) {
  if (admin.role === 'admin') return null;
  return <p className="note">Akaun pentadbir boleh melihat tetapi tidak boleh mengubah. Hubungi admin untuk membuat perubahan.</p>;
}
