export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black text-red-500">403</h1>
        <p className="text-xl text-zinc-400 font-medium">Access Denied</p>
        <p className="text-sm text-zinc-600 max-w-md">You do not have permission to view this page. Contact your administrator if you believe this is an error.</p>
        <a href="/" className="inline-block mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors">
          Return Home
        </a>
      </div>
    </div>
  );
}
