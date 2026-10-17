export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="skeleton h-10 w-56 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton h-40 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}
