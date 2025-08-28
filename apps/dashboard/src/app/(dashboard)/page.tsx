export default function DashboardHomePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Pandora's Pool Overview</h1>
      <p className="mt-2 text-gray-600">
        This is where the on-chain data for the Pandora's Pool smart contract will be displayed.
      </p>
      {/* Placeholder for charts and stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold">Total Value Locked</h3>
          <p className="text-2xl">-</p>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold">Participants</h3>
          <p className="text-2xl">-</p>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold">Return Rate</h3>
          <p className="text-2xl">-</p>
        </div>
      </div>
    </div>
  );
}
