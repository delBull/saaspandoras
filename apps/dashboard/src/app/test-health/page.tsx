export const dynamic = 'force-dynamic';

export default function TestHealthPage() {
    console.log("🏥 [TestHealth] Component Rendering...");
    return (
        <div className="p-10 text-white">
            <h1 className="text-3xl font-bold text-green-500">System Status: ONLINE</h1>
            <p className="mt-4">Runtime is functioning.</p>
            <p>Timestamp: {new Date().toISOString()}</p>
            <div className="mt-4 p-4 bg-zinc-900 rounded">
                <p>Environment Check:</p>
                <ul className="list-disc ml-5 mt-2">
                    <li>NODE_ENV: {process.env.NODE_ENV}</li>
                    <li>CHAIN_NAME: {process.env.NEXT_PUBLIC_CHAIN_NAME || 'Not Set'}</li>
                </ul>
            </div>
        </div>
    );
}
