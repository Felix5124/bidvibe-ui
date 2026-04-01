export function Skeleton({ className = '', variant = 'text' }) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    image: 'h-40 w-full',
    card: 'h-48 w-full rounded-xl',
    button: 'h-10 w-24 rounded-lg',
    badge: 'h-6 w-20 rounded-full',
    price: 'h-8 w-32',
  }

  return (
    <div className={`${baseClasses} ${variants[variant] || variants.text} ${className}`} />
  )
}

export function SessionCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="animate-pulse bg-gray-200 h-5 w-3/4 rounded mb-2" />
          <div className="animate-pulse bg-gray-200 h-4 w-1/2 rounded" />
        </div>
        <div className="animate-pulse bg-gray-200 h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-2 mt-3">
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded" />
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded" />
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded" />
      </div>
    </div>
  )
}

export function AuctionCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Skeleton variant="image" className="h-40" />
      <div className="p-4">
        <Skeleton variant="title" className="mb-2" />
        <Skeleton variant="price" className="mb-3" />
        <div className="flex gap-2 mb-3">
          <Skeleton variant="badge" className="w-16" />
          <Skeleton variant="badge" className="w-20" />
        </div>
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
  )
}

export function ItemCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Skeleton variant="image" className="h-32" />
      <div className="p-4">
        <Skeleton variant="title" className="mb-2" />
        <div className="flex gap-2 mb-2">
          <Skeleton variant="badge" className="w-16" />
          <Skeleton variant="badge" className="w-14" />
        </div>
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  )
}

export function MarketListingCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Skeleton variant="image" className="h-48" />
      <div className="p-4">
        <Skeleton variant="title" className="mb-2" />
        <div className="flex items-center gap-2 mb-3">
          <Skeleton variant="avatar" />
          <Skeleton variant="text" className="w-24" />
        </div>
        <Skeleton variant="price" className="mb-2" />
        <div className="flex gap-2">
          <Skeleton variant="badge" className="w-20" />
          <Skeleton variant="badge" className="w-16" />
        </div>
      </div>
    </div>
  )
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div>
          <Skeleton variant="text" className="w-32 mb-1" />
          <Skeleton variant="text" className="w-24" />
        </div>
      </div>
      <div className="text-right">
        <Skeleton variant="text" className="w-20 mb-1" />
        <Skeleton variant="badge" className="w-16" />
      </div>
    </div>
  )
}

export function NotificationItemSkeleton() {
  return (
    <div className="flex gap-3 p-4 border border-gray-200 rounded-lg">
      <Skeleton variant="avatar" />
      <div className="flex-1">
        <Skeleton variant="text" className="w-3/4 mb-2" />
        <Skeleton variant="text" className="w-1/2 mb-2" />
        <Skeleton variant="text" className="w-1/4" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="border-b border-gray-200">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <Skeleton variant="text" className="w-24 mb-2" />
      <Skeleton variant="title" className="w-16" />
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="avatar" />
        <div>
          <Skeleton variant="text" className="w-32 mb-1" />
          <Skeleton variant="text" className="w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton variant="button" className="w-20" />
        <Skeleton variant="button" className="w-24" />
        <Skeleton variant="button" className="w-20" />
      </div>
    </div>
  )
}

export function SessionsListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function AuctionsListSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <AuctionCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ItemsListSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function MarketListingsSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MarketListingCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function NotificationsListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  )
}

export function TransactionsListSkeleton({ count = 10 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionRowSkeleton key={i} />
      ))}
    </div>
  )
}

export default Skeleton