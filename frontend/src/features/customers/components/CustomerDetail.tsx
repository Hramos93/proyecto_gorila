import React from 'react';
import { useParams, Link } from 'react-router-dom';

export const CustomerDetail = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="p-6 bg-zinc-950 text-white min-h-screen">
            <h1 className="text-2xl font-bold text-yellow-400">Customer Profile</h1>
            <p className="mt-2 text-lg">Details for customer ID: <span className="font-mono text-yellow-400">{id}</span></p>
            <div className="mt-8">
                <p className="text-zinc-400">
                    (This is a placeholder page. Full implementation in a future task.)
                </p>
            </div>
            <Link to="/customers" className="mt-8 inline-block bg-yellow-400 text-zinc-900 font-bold px-6 py-2 rounded-md hover:bg-yellow-500 transition-colors">
                Back to Directory
            </Link>
        </div>
    );
};
