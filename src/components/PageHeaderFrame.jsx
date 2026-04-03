export default function PageHeaderFrame({ title, description, actions = null, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900 text-white p-6 md:p-8 mb-6 ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
          {description && <p className="mt-2 text-slate-200">{description}</p>}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
    </div>
  )
}
